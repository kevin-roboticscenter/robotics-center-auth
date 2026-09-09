import Image from "next/image";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <Image
        className="brand-mark"
        src="/rc-logo.png"
        alt=""
        width={604}
        height={327}
        priority
      />
      <div className="brand-copy">
        <p className="brand-name">Robotics Center of Silicon Valley</p>
        <p className="brand-kicker">Robotics data &amp; operations platform</p>
      </div>
    </div>
  );
}
