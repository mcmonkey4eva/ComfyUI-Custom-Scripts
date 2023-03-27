import { app } from "/scripts/app.js";

// Adds functionality to add widget values to SaveImage node outputs

app.registerExtension({
	name: "pysssss.SaveImageExtraOutput",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData.name === "SaveImage") {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

				const widget = this.widgets.find((w) => w.name === "filename_prefix");
				widget.serializeValue = () => {
					return widget.value.replace(/%([^%]+)%/g, function (match, text) {
						const split = text.split(".");
						if (split.length !== 2) {
							if (text !== "width" && text !== "height") {
								// Dont warn on standard replacements
								console.warn("Invalid replacement pattern", text);
							}
							return match;
						}

						// Find node with matching S&R property name
						let nodes = app.graph._nodes.filter((n) => n.properties?.["Node name for S&R"] === split[0]);
						// If we cant, see if there is a node with that title
						if (!nodes.length) {
							nodes = app.graph._nodes.filter((n) => n.title === split[0]);
						}
						if (!nodes.length) {
							console.warn("Unable to find node", split[0]);
							return match;
						}

						if (nodes.length > 1) {
							console.warn("Multiple nodes matched", split[0], "using first match");
						}

						const node = nodes[0];

						const widget = node.widgets?.find((w) => w.name === split[1]);
						if (!widget) {
							console.warn("Unable to find widget", split[1], "on node", split[0], node);
							return match;
						}

						return ((widget.value ?? "") + "").replaceAll(/\/|\\/g, "_");
					});
				};

				return r;
			};
		} else {
			const onNodeCreated = nodeType.prototype.onNodeCreated;
			nodeType.prototype.onNodeCreated = function () {
				const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;

				if (!Object.keys(this.properties || {}).length) {
					this.addProperty("Node name for S&R", this.title, "string");
				}

				return r;
			};
		}
	},
});
