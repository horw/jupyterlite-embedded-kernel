import {DeviceService} from "../../services/DeviceService";


export class ResetDeviceUI{
    public text: string = "Reset Device"
    constructor(private deviceService: DeviceService) {
        this.deviceService = deviceService
    }

    public action(){
        this.deviceService.reset()
    }

}