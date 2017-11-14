module.exports = function (RED) {
    function DenonAVRConfig(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.host = n.host;
        this.port = n.port;
    }

    RED.nodes.registerType('denon-avr-config', DenonAVRConfig);
}