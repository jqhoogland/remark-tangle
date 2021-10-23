import {Parent, Resource, StaticPhrasingContent} from "mdast";


export interface TanglePluginOptions {
  start: string;
  /**
   Whether to accept [display string](variable=[configuration])
   - If `true`, then `remark-directive` is not needed.
   - Proceed carefully as this option may break existing links.
   */
  allowLinkNotation: boolean;
}

export interface TangleFieldShorthand extends Resource {
  type: "link" | "textDirective" | "leafDirective";

  // During `processFieldShorthand`
  name?: string;
  attributes?: Record<string, string>;
  children?: StaticPhrasingContent[];
}

export interface TangleField extends  Parent {
  type: "textDirective" | "leafDirective";
  name: string;
  attributes: Record<string, string>;
  children: StaticPhrasingContent[];

  // After `processFieldDirective`
  hName?: string;
  hProperties?: Record<string, string|number>;
}

export interface FieldAttributes {
  "data-var": string;
  "data-type": "reference" | "definition";
  "data-format"?: string;
  "data-default"?: (string | number | null);

  "style"?: Record<string, string|number>;
  "class"?: "TKAdjustableNumber" | "TKSwitch" | "TKOutput" | "TKLabel"; // This can't be locally determined for a reference-field

  // Range inputs
  "data-min"?: number;
  "data-max"?: number;
  "data-step"?: number;

  // Select inputs
  "data-choices"?: (string|number)[];

  // Outputs
  "id"?: string; // Following guid format.
  "data-formula"?: string;
}