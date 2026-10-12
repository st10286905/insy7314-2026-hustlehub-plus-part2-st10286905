import { PenTool, CodeXml, FileText, ChartNoAxesCombined, LayoutGrid } from "lucide-react";

const ICONS = {
    Design: PenTool,
    Development: CodeXml,
    Writing: FileText,
    Marketing: ChartNoAxesCombined,
    Other: LayoutGrid,
};

export default function CategoryArt({ category, size = "banner" }) {
    const Icon = ICONS[category] || LayoutGrid;
    const px = { mini: 24, thumb: 34, "thumb-lg": 40, square: 96, banner: 64 }[size] || 64;
    return (
        <span className={`cat-art cat-art-${size}`} aria-hidden="true">
            <Icon size={px} strokeWidth={size === "banner" || size === "square" ? 1.9 : 2} />
        </span>
    );
}