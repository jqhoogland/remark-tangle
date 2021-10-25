import {Root} from "mdast";

export const addScript = (tree: Root, {src, value=""}: {src?: string, value: string }, isMdx=false) =>
    tree.children.push({
        type: "element",
        data: {
            hName: "script",
            hProperties: {
                type: "text/javascript",
                ...(src ? {src} : {} ),
            }
        },
        children: [{type: "text", value}]
    })

export const addStyleSheet = (tree: Root, href: string, isMdx=false) =>
    tree.children.push({
        type: "element",
        value: isMdx ?`<link ${href ? `href="${href}"` : ""} type="text/css" rel="stylesheet"></link>`: "",
        data: {
          hName: "link",
          hProperties: {
            href,
            type: "text/css",
            rel: "stylesheet"
          }
        },
        children: [{type: "text", value: ""}]
    })

export const addStyleTag = (tree: Root, value: string="", isMdx=false) =>
    tree.children.push({
        type: "element",
        value: "",
        data: {
          hName: "style",
            hProperties: {}
        },
        children: [
            {type: "text", value}
        ]
      })

export const addExternalScripts = (tree: Root, scripts: string[], isMdx=false) =>
    scripts.forEach((src: string) => addScript(tree, {src}, isMdx))

export const addStyleSheets = (tree: Root, stylesheets: string[] , isMdx=false) =>
    stylesheets.forEach((stylesheet: string) => addStyleSheet(tree, stylesheet, isMdx))
