import {DeviceService} from "../../services/DeviceService";


export class ConnectDeviceUI{
    public text: string = "Connect Device"
    constructor(private deviceService: DeviceService) {
        this.deviceService = deviceService
    }

    public action(){
        console.log(this.deviceService)
        this.deviceService.connect()
    }

}