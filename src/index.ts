import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";

import { PLUGIN_NAME, PLATFORM_NAME } from './settings';

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */
let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory(PLUGIN_NAME, PLATFORM_NAME, MultisensorTriggerAccessory);
};

class MultisensorTriggerAccessory implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly uuid: string;
  private readonly delay: number;
  private readonly sensors: number;


  private switchTriggerState = 0;
  private switchOn = false;
  private timer;

  private readonly switchService: Service;
  private readonly informationService: Service;
  private readonly sensorsService: Service[];

  constructor(
    log: Logging, 
    config: AccessoryConfig, 
    api: API
  ) {
    this.log = log;
    this.name = config.name;
    this.delay = config['delay'] as number;
    this.sensors = config['sensors'] as number || 1;

    const UUIDGen = api.hap.uuid;

    this.uuid = UUIDGen.generate(this.name);

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Nidy86@Git")
      .setCharacteristic(hap.Characteristic.Model, "Multisensor Trigger");

    this.switchService = new hap.Service.Switch(this.name, "Switch");
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info("Current state of the switch was returned: " + (this.switchOn? "ON": "OFF"));
        callback(undefined, this.switchOn);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.switchOn = value as boolean;

        if(value){
          this.switchTriggerState = (this.switchTriggerState+1)%(this.sensors+1);
          this.updateSensors();

          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.switchService.getCharacteristic(hap.Characteristic.On).updateValue(false);
            this.switchOn = false;
          }, 1000);
        } else {
          this.switchOn = false;
          clearTimeout(this.timer);
        }
        

        log.info("Switch state was set to: " + (this.switchOn? "ON": "OFF"));
        callback();
      });
    
    this.sensorsService = [];
    for(let _i=0; _i<this.sensors; _i++){
      const motionSensor = new hap.Service.MotionSensor(this.name + " Trigger " + (_i+1), "Motion" + _i );
      motionSensor
        .getCharacteristic(hap.Characteristic.MotionDetected)
        .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) =>{
          const idx = _i+1;
          callback(null, (this.switchTriggerState===idx));
        });
      this.sensorsService.push(motionSensor);
    }

    log.info("Switch finished initializing!");
  }

  updateSensors(): void {
    for(const _i in this.sensorsService){
      const idx = parseInt(_i)+1;
      this.sensorsService[_i].getCharacteristic(hap.Characteristic.MotionDetected).updateValue(this.switchTriggerState===idx);
    }
  }

  /*
   * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
   * Typical this only ever happens at the pairing process.
   */
  identify(): void {
    this.log("Identify!");
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.switchService,
      ...this.sensorsService,
    ];
  }

}