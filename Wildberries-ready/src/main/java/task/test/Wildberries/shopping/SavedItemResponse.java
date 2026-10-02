package task.test.Wildberries.shopping;

public record SavedItemResponse(
        Long id,
        Marketplace marketplace,
        String productKey,
        SavedItemType itemType,
        Integer quantity
) {
    public static SavedItemResponse from(SavedItem item) {
        return new SavedItemResponse(
                item.getId(),
                item.getMarketplace(),
                item.getProductKey(),
                item.getItemType(),
                item.getQuantity()
        );
    }
}