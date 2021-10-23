import {Root} from "mdast";

export const addScript = (tree: Root, {src, value}: {src?: string, value?: string }) =>
    tree.children.push({
        type: "code",
        value,
        data: {
            hName: "script",
            hProperties: {
                type: "text/javascript",
                ...(src ? {src} : {} ),
            }
        }
    })

export const addStyleSheet = (tree: Root, href: string) =>
    tree.children.push({
        type: "code",
        value: null,
        data: {
          hName: "link",
          hProperties: {
            href,
            type: "text/css",
            rel: "stylesheet"
          }
        }
    })

export const addStyleTag = (tree: Root, value: string) =>
    tree.children.push({
        type: "code",
        value,
        data: {
          hName: "style",
        }
      })

export const addExternalScripts = (tree: Root, scripts: string[]) =>
    scripts.forEach((src: string) => addScript(tree, {src}))

export const addStyleSheets = (tree: Root, stylesheets: string[] ) =>
    stylesheets.forEach((stylesheet: string) => addStyleSheet(tree, stylesheet))
