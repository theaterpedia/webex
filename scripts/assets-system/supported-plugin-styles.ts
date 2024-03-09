import { Settings } from "scripts/settings/settings";
import { WebAsset } from "./base-asset.js";
import { AssetType, InlinePolicy, LoadMethod, Mutability } from "./asset-types.js";
import { ExportLog } from "scripts/render-api/render-api";

export class SupportedPluginStyles extends WebAsset
{
    constructor()
    {
        super("supported-plugins.css", "", null, AssetType.Style, InlinePolicy.AutoHead, true, Mutability.Dynamic, LoadMethod.Async, 5);
    }
    
    override async load()
    {
        this.data = "";
        let stylesheets = document.styleSheets;

		for(let i = 1; i < stylesheets.length; i++) 
        {
            // @ts-ignore
            let styleID = stylesheets[i].ownerNode?.id;

            if 
			(
				styleID == "ADMONITIONS_CUSTOM_STYLE_SHEET" || 
				styleID == "css-settings-manager" ||
				styleID == "colored-tags-wrangler" ||
				styleID == "highlightr-styles" ||
				(Settings.includeSvelteCSS && this.isSvelteStylesheet(stylesheets[i]))
			)
            {
                ExportLog.log("Including stylesheet: " + styleID);
                let style = stylesheets[i].cssRules;

                for(let item in style) 
                {
                    if(style[item].cssText != undefined)
                    {
                        
                        this.data += "\n" + style[item].cssText;
                    }
                }
            }

			this.data += "\n\n /* ---- */\n\n";
        }

        await super.load();
    }

	getStylesheetContent(stylesheet: CSSStyleSheet): string
	{
		let content = "";
		let style = stylesheet.cssRules;

		for(let item in style) 
		{
			if(style[item].cssText != undefined)
			{
				content += "\n" + style[item].cssText;
			}
		}

		return content;
	}

	isSvelteStylesheet(stylesheet: CSSStyleSheet): boolean
	{
		if(stylesheet.ownerNode == undefined) return false;
		// @ts-ignore
		let styleID = stylesheet.ownerNode.id;

		if (styleID.contains("svelte")) return true;

		let sheetContent = this.getStylesheetContent(stylesheet);
		let first1000 = sheetContent.substring(0, 1000);
		if (first1000.contains(".svelte-")) 
		{
			return true;
		}

		return false;
	}
}