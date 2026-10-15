import { useId } from "react";

export type DeskKind =
    | "laptop"
    | "keyboard"
    | "mouse"
    | "headphones";

export default function DeskSceneArt({
                                         kinds,
                                     }: {
    kinds: DeskKind[];
}) {
    const id = useId().replace(/:/g, "");
    const has = (kind: DeskKind) => kinds.includes(kind);

    return (
        <svg
            viewBox="0 0 1000 620"
            aria-hidden="true"
            focusable="false"
            width="1000"
            height="620"
        >
            <defs>
                <linearGradient
                    id={`${id}wall`}
                    x2="1"
                    y2="1"
                >
                    <stop stopColor="#e1e8d4" />
                    <stop offset="1" stopColor="#b7c8ad" />
                </linearGradient>

                <linearGradient
                    id={`${id}desk`}
                    x2="0"
                    y2="1"
                >
                    <stop stopColor="#f4e7d1" />
                    <stop offset="1" stopColor="#c3a989" />
                </linearGradient>

                <linearGradient
                    id={`${id}metal`}
                    x2="1"
                    y2="1"
                >
                    <stop stopColor="#616b64" />
                    <stop offset="1" stopColor="#202a25" />
                </linearGradient>

                <linearGradient
                    id={`${id}screen`}
                    x2="1"
                    y2="1"
                >
                    <stop stopColor="#d9d1eb" />
                    <stop offset="1" stopColor="#8d9d87" />
                </linearGradient>

                <filter
                    id={`${id}shadow`}
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="180%"
                >
                    <feDropShadow
                        dx="0"
                        dy="12"
                        stdDeviation="10"
                        floodColor="#293b28"
                        floodOpacity=".17"
                    />
                </filter>
            </defs>

            <rect
                width="1000"
                height="620"
                fill={`url(#${id}wall)`}
            />

            <circle
                cx="890"
                cy="80"
                r="170"
                fill="#eff0dc"
                opacity=".45"
            />

            {/* Decorative framed artwork */}
            <rect
                x="62"
                y="65"
                width="155"
                height="180"
                rx="12"
                fill="#f5eedf"
            />

            <path
                d="M83 217V87h112v130Z"
                fill="#d8c9df"
            />

            <circle
                cx="160"
                cy="122"
                r="24"
                fill="#efceae"
            />

            <path
                d="m83 190 48-42 64 69H83Z"
                fill="#8aa27a"
            />

            {/* Desk */}
            <path
                d="M0 349h1000v221H0Z"
                fill={`url(#${id}desk)`}
            />

            <path
                d="M0 552h1000v68H0Z"
                fill="#a98b70"
            />

            <path
                d="M0 551h1000"
                stroke="#f6e9d5"
                strokeWidth="6"
            />

            {/* Decorative plant */}
            <ellipse
                cx="116"
                cy="368"
                rx="68"
                ry="15"
                fill="#687a59"
                opacity=".18"
            />

            <path
                d="M78 289h76l-12 75H91Z"
                fill="#c6997e"
            />

            <path
                d="M116 295V194"
                stroke="#627952"
                strokeWidth="7"
            />

            <path
                d="M116 249c-56-6-70-51-57-71 44 9 61 40 57 71Zm0-23c10-61 43-84 72-71 0 45-39 67-72 71Z"
                fill="#718d5e"
            />

            <path
                d="M116 210c-33-13-42-50-30-69 27 12 38 40 30 69Z"
                fill="#8aa778"
            />

            {/* Decorative cup */}
            <ellipse
                cx="866"
                cy="483"
                rx="57"
                ry="15"
                fill="#766953"
                opacity=".16"
            />

            <rect
                x="835"
                y="416"
                width="54"
                height="61"
                rx="13"
                fill="#f6edde"
            />

            <path
                d="M887 427c36-6 38 38 0 36"
                fill="none"
                stroke="#f6edde"
                strokeWidth="12"
            />

            {has("laptop") && (
                <g filter={`url(#${id}shadow)`}>
                    <path
                        d="m285 137 308 0 20 205H266Z"
                        fill={`url(#${id}metal)`}
                    />

                    <path
                        d="m296 150 286 0 15 176H280Z"
                        fill={`url(#${id}screen)`}
                    />

                    <path
                        d="M280 295c74-104 140 37 204-59 40-59 81-27 108-16v106H280Z"
                        fill="#d5dfc7"
                        opacity=".7"
                    />

                    <circle
                        cx="536"
                        cy="198"
                        r="30"
                        fill="#efcfba"
                    />

                    <path
                        d="m266 342 347 0 53 48H218Z"
                        fill="#6c786e"
                    />

                    <path
                        d="m293 351 270 0 29 24H269Z"
                        fill="#303d35"
                    />

                    <path
                        d="M218 390h448l-11 10H230Z"
                        fill="#25372c"
                    />

                    <rect
                        x="402"
                        y="379"
                        width="80"
                        height="9"
                        rx="4"
                        fill="#a9b5a6"
                    />
                </g>
            )}

            {has("keyboard") && (
                <g filter={`url(#${id}shadow)`}>
                    <path
                        d="m239 429 318 0 28 60H209Z"
                        fill="#333e37"
                    />

                    {Array.from({ length: 3 }, (_, row) =>
                        Array.from({ length: 12 }, (_, col) => (
                            <rect
                                key={`${row}-${col}`}
                                x={244 + col * 25 - row * 6}
                                y={435 + row * 14}
                                width="19"
                                height="10"
                                rx="2"
                                fill={
                                    row === 0 && col % 3 === 0
                                        ? "#d7c8e7"
                                        : "#bfcbb7"
                                }
                            />
                        )),
                    )}

                    <rect
                        x="307"
                        y="477"
                        width="180"
                        height="6"
                        rx="2"
                        fill="#ddcbaa"
                    />
                </g>
            )}

            {has("mouse") && (
                <g filter={`url(#${id}shadow)`}>
                    <ellipse
                        cx="665"
                        cy="462"
                        rx="68"
                        ry="37"
                        fill="#b2bea1"
                    />

                    <path
                        d="M644 415c9-20 32-20 42 0l14 44c1 30-70 30-68 0Z"
                        fill="#35473a"
                    />

                    <path
                        d="M665 402v38"
                        stroke="#91a886"
                        strokeWidth="2"
                    />

                    <rect
                        x="661"
                        y="410"
                        width="8"
                        height="18"
                        rx="4"
                        fill="#c4d4b7"
                    />
                </g>
            )}

            {has("headphones") && (
                <g filter={`url(#${id}shadow)`}>
                    <path
                        d="M755 287v-47c0-92 132-92 132 0v47"
                        fill="none"
                        stroke="#38463b"
                        strokeWidth="24"
                    />

                    <path
                        d="M765 237c0-69 111-69 111 0"
                        fill="none"
                        stroke="#899b7c"
                        strokeWidth="8"
                    />

                    <rect
                        x="737"
                        y="247"
                        width="40"
                        height="91"
                        rx="18"
                        fill="#303e34"
                    />

                    <rect
                        x="866"
                        y="247"
                        width="40"
                        height="91"
                        rx="18"
                        fill="#303e34"
                    />

                    <rect
                        x="761"
                        y="256"
                        width="22"
                        height="74"
                        rx="10"
                        fill="#a6b896"
                    />

                    <rect
                        x="859"
                        y="256"
                        width="22"
                        height="74"
                        rx="10"
                        fill="#a6b896"
                    />
                </g>
            )}
        </svg>
    );
}