const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

module.exports = function(RED) {
  function BedrockNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Initialize client once
    let client;
    try {
      client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || config.region || "us-east-1"
      });
    } catch (err) {
      node.error("Failed to initialize Bedrock client: " + err.message);
      return;
    }

    node.on("input", async (msg) => {
      try {
        // Validate payload
        if (!msg.payload) {
          node.error("No payload provided");
          node.status({ fill: "red", shape: "ring", text: "No payload" });
          return;
        }

        // Ensure payload is a string
        const bodyString = typeof msg.payload === "string" 
          ? msg.payload 
          : JSON.stringify(msg.payload);

        node.status({ fill: "blue", shape: "dot", text: "calling bedrock..." });

        const command = new InvokeModelCommand({
          modelId: config.model || msg.model || "anthropic.claude-3-haiku-20240307-v1:0",
          body: bodyString
        });

        const response = await client.send(command);
        
        // Safely decode and parse response
        const text = new TextDecoder().decode(response.body);
        let bedrockResponse;
        
        try {
          bedrockResponse = JSON.parse(text);
        } catch (parseErr) {
          node.error("Failed to parse Bedrock response: " + parseErr.message);
          node.status({ fill: "red", shape: "ring", text: "Parse error" });
          return;
        }

        msg.bedrock = bedrockResponse;
        node.status({ fill: "green", shape: "dot", text: "success" });
        node.send(msg);

      } catch (err) {
        node.error(err);
        node.status({ fill: "red", shape: "ring", text: "error: " + err.message });
      }
    });

    // Clean up on node close
    node.on("close", () => {
      if (client) {
        client.destroy?.();
      }
    });
  }

  RED.nodes.registerType("bedrock", BedrockNode);
};
