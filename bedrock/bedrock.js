import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export default function(RED) {
  function BedrockNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || config.region || "us-east-1"
    });

    node.on("input", async (msg) => {
      try {
        const command = new InvokeModelCommand({
          modelId: config.model || msg.model || "anthropic.claude-3-haiku-20240307-v1:0",
          body: JSON.stringify(msg.payload)
        });

        const response = await client.send(command);
        const text = new TextDecoder().decode(response.body);
        msg.bedrock = JSON.parse(text);
        node.send(msg);
      } catch (err) {
        node.error(err);
      }
    });
  }

  RED.nodes.registerType("bedrock", BedrockNode);
}
