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
  Service,
} from 'homebridge';

import { PLUGIN_NAME, PLATFORM_NAME } from './settings';

let hap: HAP;

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
    api: API,
  ) {
    this.log = log;
    this.name = config.name;
    this.delay = config['delay'] as number;
    this.sensors = config['sensors'] as number || 1;

    const UUIDGen = api.hap.uuid;

    this.uuid = UUIDGen.generate(this.name);

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Nidy86@Git')
      .setCharacteristic(hap.Characteristic.Model, 'Multisensor Trigger');

    this.switchService = new hap.Service.Switch(this.name, 'Switch');
    this.switchService.getCharacteristic(hap.Characteristic.On)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        log.info('Current state of the switch was returned: ' + (this.switchOn? 'ON': 'OFF'));
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
        

        log.info('Switch state was set to: ' + (this.switchOn? 'ON': 'OFF'));
        callback();
      });
    
    this.sensorsService = [];
    for(let _i=0; _i<this.sensors; _i++){
      const motionSensor = new hap.Service.MotionSensor(this.name + ' Trigger ' + (_i+1), 'Motion' + _i );
      motionSensor
        .getCharacteristic(hap.Characteristic.MotionDetected)
        .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) =>{
          const idx = _i+1;
          callback(null, (this.switchTriggerState===idx));
        });
      this.sensorsService.push(motionSensor);
    }

    log.info('Switch finished initializing!');
  }

  updateSensors(): void {
    for(const _i in this.sensorsService){
      const idx = parseInt(_i)+1;
      this.sensorsService[_i].getCharacteristic(hap.Characteristic.MotionDetected).updateValue(this.switchTriggerState===idx);
    }
  }

  identify(): void {
    this.log('Identify!');
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.switchService,
      ...this.sensorsService,
    ];
  }

}