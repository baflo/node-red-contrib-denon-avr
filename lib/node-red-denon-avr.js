const Denon = require('denon-client');

Denon.DenonClient.prototype.safeSetPower = function (powerState) {
    // Requires other handling, because setPower fails if current value is same as value to be set
    const value = powerState || Denon.Options.PowerOptions.Status;

    return this.getPower()
        .then(p => {
            if (p === value) {
                return value;
            }

            return client.setPower(value);
        });
}

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

            node.on('input', msg => {
                handler(denonClient, msg)
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
            Denon.Options.DisplayDimOptions[msg.payload] || Denon.Options.DisplayDimOptions.Status
        )
    ));

    RED.nodes.registerType('set-input', connectDenonAVRNode(
        (client, msg) => client.safeSetPower(Denon.Options.PowerOptions.On)
            .then(() => client.setInput(
                Denon.Options.InputOptions[msg.payload] || Denon.Options.InputOptions.Status
            ))
    ));

    RED.nodes.registerType('set-mute', connectDenonAVRNode(
        (client, msg) => client.setMute(
            Denon.Options.MuteOptions[msg.payload] || Denon.Options.MuteOptions.Status
        )
    ));

    RED.nodes.registerType('set-power', connectDenonAVRNode(
        (client, msg) => {
            const value = Denon.Options.PowerOptions[msg.payload] || Denon.Options.PowerOptions.Status;

            return client.safeSetPower(value);
        }
    ));

    RED.nodes.registerType('set-volume', connectDenonAVRNode(
        (client, msg) => {
            // setVolume does not, opposed to the other functions, return new value
            const value = isNaN(msg.payload) ? Denon.Options.VolumeOptions[msg.payload] : parseInt(msg.payload);

            return client.setVolume(value || Denon.Options.VolumeOptions.Status)
                .then(() => client.getVolume())
        }
    ));
}
