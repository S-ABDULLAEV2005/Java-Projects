type WildMarketLogoProps = {
    className?: string;
};

export default function WildMarketLogo({
                                           className = "",
                                       }: WildMarketLogoProps) {
    return (
        <span
            className={`wildmarket-logo ${className}`}
            role="img"
            aria-label="WildMarket"
        >
            <svg
                viewBox="0 0 342 78"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
            >
                {/* First part of the name */}
                <text
                    x="0"
                    y="62"
                    textLength="124"
                    lengthAdjust="spacingAndGlyphs"
                    className="wildmarket-logo-wild"
                >
                    Wild
                </text>

                {/* Shopping-bag handle above the M */}
                <path
                    className="wildmarket-logo-handle"
                    d="M143 24 V19 C143 5 163 5 163 19 V24"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                {/* Custom M: the body of the shopping bag */}
                <path
                    className="wildmarket-logo-market"
                    d="
                        M132 62
                        V23
                        H143
                        L153 44
                        L163 23
                        H174
                        V62
                        H163
                        V44
                        L153 62
                        L143 44
                        V62
                        Z
                    "
                />

                {/* Remaining letters */}
                <text
                    x="179"
                    y="62"
                    textLength="159"
                    lengthAdjust="spacingAndGlyphs"
                    className="wildmarket-logo-market"
                >
                    arket
                </text>
            </svg>
        </span>
    );
}