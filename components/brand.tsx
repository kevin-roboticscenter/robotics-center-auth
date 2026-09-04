import Image from "next/image";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <Image
        className="brand-mark"
        src="/rc-mark.svg"
        alt=""
        width={compact ? 48 : 70}
        height={compact ? 48 : 70}
        priority
      />
      <div className="brand-copy">
        <p className="brand-name">Silicon Valley Robotics Center</p>
        <p className="brand-kicker">Robotics data &amp; operations platform</p>
      </div>
    </div>
  );
}
