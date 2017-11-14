const Denon = require('denon-client');

module.exports = function (RED) {
    const clients = {};

    function createDenonClient(config) {
        if (!clients[config.avr]) {
            const avrConfig = RED.nodes.getNode(config.avr);
            clients[config.avr] = new Denon.DenonClient(`${avrConfig.host}`);
            clients[config.avr].on('close', () => {
                delete clients[config.avr];
            });
            clients[config.avr].connect();
        }

        return clients[config.avr];
    }

    function connectDenonAVRNode(handler) {
        return function (config) {
            RED.nodes.createNode(this, config);
            const node = this;
            const denonClient = createDenonClient(config);
            const func = handler.bind(denonClient);

            node.on('input', msg => {
                func(msg)
                    .then(response => {
                        msg.payload = response;
                        node.send(msg);
                    })
                    .catch(err => {
                        msg.payload = { error: err };
                        node.send(msg);
                    });
            });
        }
    }

    RED.nodes.registerType('get-display', connectDenonAVRNode((client, msg) => client.getBrightness()));
    RED.nodes.registerType('get-input', connectDenonAVRNode((client, msg) => client.getInput()));
    RED.nodes.registerType('get-mute', connectDenonAVRNode((client, msg) => client.getMute()));
    RED.nodes.registerType('get-power', connectDenonAVRNode((client, msg) => client.getPower()));
    RED.nodes.registerType('get-volume', connectDenonAVRNode((client, msg) => client.getVolume()));

    RED.nodes.registerType('set-display', connectDenonAVRNode(
        (client, msg) => client.setBrightness(
            Denon.Options.DisplayDimOptions[msg.req.body] || Denon.Options.DisplayDimOptions.Status
        )
    ));

    RED.nodes.registerType('set-input', connectDenonAVRNode(
        (client, msg) => client.setInput(
            Denon.Options.InputOptions[msg.req.body] || Denon.Options.InputOptions.Status
        )
    ));

    RED.nodes.registerType('set-mute', connectDenonAVRNode(
        (client, msg) => client.setMute(
            Denon.Options.MuteOptions[msg.req.body] || Denon.Options.MuteOptions.Status
        )
    ));

    RED.nodes.registerType('set-power', connectDenonAVRNode(
        (client, msg) => client.setPower(
            Denon.Options.PowerOptions[msg.req.body] || Denon.Options.PowerOptions.Status
        )
    ));

    RED.nodes.registerType('set-volume', connectDenonAVRNode(
        (client, msg) => client.setVolume(
            Denon.Options.VolumeOptions[msg.req.body] || Denon.Options.VolumeOptions.Status
        )
    ));
}