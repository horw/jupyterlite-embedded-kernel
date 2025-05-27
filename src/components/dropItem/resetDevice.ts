import {DeviceService} from "../../services/DeviceService";
import {callAlert} from "../Alert";


export class ResetDeviceUI{
    public text: string = "Reset Device"
    constructor(private deviceService: DeviceService) {
        this.deviceService = deviceService
    }

    public action(){
        this.deviceService.reset()
        callAlert("Device was reset")
    }

}