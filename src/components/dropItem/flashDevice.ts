import {DeviceService} from "../../services/DeviceService";
import {FirmwareService} from "../../services/FirmwareService";


export class FlashDeviceUI{
    public text: string = "Flash Device"
    constructor(
        private deviceService: DeviceService,
        private firmwareService: FirmwareService
    ) {
        this.deviceService = deviceService
    }

    public action(){
        this.deviceService.getDeviceType()
        this.firmwareService.getFirmwareOptions()
    }

}