import {DeviceService} from "../../services/DeviceService";
import {callAlert} from "../Alert";

export class ConnectDeviceUI{
    public text: string = "Connect Device"
    constructor(private deviceService: DeviceService) {
        this.deviceService = deviceService
    }

    public action(){
        if(this.deviceService.isConnected()){
            callAlert(
            `
                Device already connected
                if you want to recconect to another device please open new notebook, or reload page
            `
            )
        }
        this.deviceService.connect()
    }

}