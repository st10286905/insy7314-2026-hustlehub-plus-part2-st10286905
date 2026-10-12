import DOMPurify from "dompurify";

export function sanitiseHtml(dirty) {
    if (typeof dirty !== "string") return "";
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            "p", "br", "b", "strong", "i", "em", "u", "s", "ul", "ol", "li",
            "h1", "h2", "h3", "h4", "blockquote", "a", "pre", "code", "span",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "class"],
        FORCE_BODY: true,
    });
}

export function toPlainText(html) {
    if (typeof html !== "string") return "";
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const div = document.createElement("div");
    div.innerHTML = clean;
    return div.textContent ?? "";
}