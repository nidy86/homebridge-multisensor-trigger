
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Homebridge-multisensor-trigger

With this plugin, you can create any number of dummy switches that will start a timer when turned ON, when the delay time is reached the switch will automatically turn OFF. Every switch has a number of motions sensors. Everytime the switch is turned ON the next sensor will be activated. This can be very useful for advanced automation with HomeKit scenes - when multiple lights in a room should be activated with one event.

## Installations

This plugin is for [HOOBS](https://hoobs.org/) and can be easily installed and configured through their UI.

If you don't use HOOBS (or Homebridge UI), keep reading:

 * ```sudo npm install -g homebridge-multisensor-trigger```
* Create an accessory in your config.json file
* Restart homebridge

## Example config.json:

 ```
    "accessories": [
        {
            "accessory": "MultisensorTrigger",
            "plugin_map": {
                "plugin_name": "homebridge-multisensor-trigger",
                "index":0
            },
            "name": "TriggerSwitch 1",
            "delay": 1000,
            "sensors":3
        }   
    ]

```

|             Parameter            |         Description         | Required |  Default |   type   |
| -------------------------------- | --------------------------- |:--------:|:--------:|:--------:|
| `accessory`             | always `"MultisensorTrigger"         |     ✓    |     -    |  String  |
| `name`                  | Name for your accessory              |     ✓    |     -    |  String  |
| `delay`                 | Delay/Timer in milliseconds          |     ✓    |  1000    |  Integer |
| `sensors`               | Remove the Motion Sensor             |     ✓    |     1    |  Integer |

# What does this plugin do?
When turning the switch ON, it activates the next sensor in list and turns OFF automatically after the delay time. For example if you use 3 sensors this is the click logic:
1. First ON:  Sensor 1 ON,  Sensor 2 OFF, Sensor 3 OFF
2. Second ON: Sensor 1 OFF, Sensor 2 ON,  Sensor 3 OFF
3. Third ON:  Sensor 1 OFF, Sensor 2 OFF, Sensor 3 ON
4. OFF:       Sensor 1 OFF, Sensor 2 OFF, Sensor 3 OFF

## Why do we need this plugin?

If you want to use a remote-control with 1 Button (e.g. EVE Button) you can use the trigger to rotate through several scenes by using only one button event.

## Why Adding Motion Sensors?
The switch is trigged by the remote-control device. The motion sensors can be used as triggers for automations of light-scenes and everytime the switch is turned ON, the light-scene changes.

## Possible Characteristics and Services
This plugin has been created based on the [homebridge-plugin-template](https://github.com/homebridge/homebridge-plugin-template).
Description of characteristics (available methods and how to build listener) can be found in the [Homebridge-API](https://developers.homebridge.io/#/)

A special thanks to Github-User [NityBZ](https://github.com/nitaybz), who inspired me to adapt his [Project](https://github.com/nitaybz/homebridge-delay-switch) for my personal needs.

## Start in Developer Mode

To start the plugin in developer mode run `homebridge -D -P . -U ~/.homebridge-dev/` while beeing in the root directory. A sample config has to be saved at `~/.homebridge-dev/`.