package task.test.Wildberries.media;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
public class ProductImageService {

    private static final Logger log =
            LoggerFactory.getLogger(ProductImageService.class);

    private static final int MAX_BYTES = 3 * 1024 * 1024;

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final RestClient client;

    public ProductImageService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {

        this.cloudName = cloudName.trim();
        this.apiKey = apiKey.trim();
        this.apiSecret = apiSecret.trim();

        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        JdkClientHttpRequestFactory factory =
                new JdkClientHttpRequestFactory(http);

        factory.setReadTimeout(Duration.ofSeconds(40));

        this.client = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    public String upload(MultipartFile file) {
        if (!cloudName.matches("[A-Za-z0-9_-]+")
                || apiKey.isBlank()
                || apiSecret.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Image storage is not configured"
            );
        }

        if (file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Choose an image no larger than 3 MB"
            );
        }

        Prepared image;

        try {
            image = prepare(file);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The image cannot be read. Choose another JPEG or PNG"
            );
        }

        String publicId =
                "wildmarket/products/" + UUID.randomUUID();

        String timestamp =
                Long.toString(Instant.now().getEpochSecond());

        String signature = sign(
                "public_id=" + publicId
                        + "&timestamp=" + timestamp
                        + apiSecret
        );

        ByteArrayResource resource =
                new ByteArrayResource(image.bytes()) {
                    @Override
                    public String getFilename() {
                        return "product." + image.format();
                    }
                };

        HttpHeaders fileHeaders = new HttpHeaders();

        fileHeaders.setContentType(
                image.format().equals("png")
                        ? MediaType.IMAGE_PNG
                        : MediaType.IMAGE_JPEG
        );

        LinkedMultiValueMap<String, Object> body =
                new LinkedMultiValueMap<>();

        body.add("file", new HttpEntity<>(resource, fileHeaders));
        body.add("api_key", apiKey);
        body.add("public_id", publicId);
        body.add("timestamp", timestamp);
        body.add("signature", signature);

        JsonNode result;

        try {
            result = client.post()
                    .uri(
                            "https://api.cloudinary.com/v1_1/"
                                    + cloudName
                                    + "/image/upload"
                    )
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

        } catch (RestClientException exception) {
            log.warn(
                    "Product image storage request failed: type={}",
                    exception.getClass().getSimpleName()
            );

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Image upload failed. Check storage configuration and try again"
            );
        }

        String url = result == null
                ? ""
                : result.path("secure_url").asText("");

        try {
            URI uri = URI.create(url);

            if (!"https".equals(uri.getScheme())
                    || !"res.cloudinary.com".equals(uri.getHost())
                    || uri.getPath() == null
                    || !uri.getPath().startsWith(
                    "/" + cloudName + "/image/upload/"
            )
                    || url.length() > 255) {

                throw new IllegalArgumentException();
            }

        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Image storage returned an invalid URL"
            );
        }

        log.info(
                "Product image uploaded: bytes={} width={} height={}",
                image.bytes().length,
                image.width(),
                image.height()
        );

        return url;
    }

    private Prepared prepare(MultipartFile file)
            throws IOException {

        BufferedImage source;

        try (
                InputStream input = file.getInputStream();
                ImageInputStream stream =
                        ImageIO.createImageInputStream(input)
        ) {
            if (stream == null) {
                throw new IOException("Unreadable image");
            }

            var readers = ImageIO.getImageReaders(stream);

            if (!readers.hasNext()) {
                throw new ResponseStatusException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "Only JPEG and PNG images are supported"
                );
            }

            ImageReader reader = readers.next();

            try {
                String format = reader.getFormatName()
                        .toLowerCase(Locale.ROOT);

                if (!format.equals("jpeg")
                        && !format.equals("jpg")
                        && !format.equals("png")) {

                    throw new ResponseStatusException(
                            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                            "Only JPEG and PNG images are supported"
                    );
                }

                reader.setInput(stream, true, true);

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width < 1
                        || height < 1
                        || width > 6000
                        || height > 6000
                        || (long) width * height > 12_000_000) {

                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Choose a photo under 12 megapixels and no larger than 6000 pixels per side"
                    );
                }

                source = reader.read(0);

                if (source == null) {
                    throw new IOException("Unreadable image");
                }

            } finally {
                reader.dispose();
            }
        }

        double scale = Math.min(
                1.0,
                1600.0 / Math.max(
                        source.getWidth(),
                        source.getHeight()
                )
        );

        int width = Math.max(
                1,
                (int) Math.round(source.getWidth() * scale)
        );

        int height = Math.max(
                1,
                (int) Math.round(source.getHeight() * scale)
        );

        boolean alpha = source.getColorModel().hasAlpha();
        String format = alpha ? "png" : "jpg";

        BufferedImage resized = new BufferedImage(
                width,
                height,
                alpha
                        ? BufferedImage.TYPE_INT_ARGB
                        : BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = resized.createGraphics();

        try {
            graphics.setRenderingHint(
                    RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BICUBIC
            );

            graphics.drawImage(
                    source,
                    0,
                    0,
                    width,
                    height,
                    null
            );

        } finally {
            graphics.dispose();
        }

        ByteArrayOutputStream output =
                new ByteArrayOutputStream();

        if (!ImageIO.write(resized, format, output)) {
            throw new IOException("Image encoding failed");
        }

        if (output.size() > MAX_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "The processed image is still too large. Choose a smaller photo"
            );
        }

        return new Prepared(
                output.toByteArray(),
                format,
                width,
                height
        );
    }

    private String sign(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(
                                    value.getBytes(
                                            StandardCharsets.UTF_8
                                    )
                            )
            );

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record Prepared(
            byte[] bytes,
            String format,
            int width,
            int height
    ) {
    }
}