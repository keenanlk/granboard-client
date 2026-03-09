declare module "*.mp4" {
  const src: string;
  export default src;
}

type RequestDeviceOptions = {
  filters?: {
    services?: Array<number | string>;
    name?: string;
    namePrefix?: string;
    manufacturerData?: DataView;
  }[];
  optionalServices?: Array<number | string>;
  acceptAllDevices?: boolean;
};

interface Navigator {
  bluetooth?: Bluetooth;
}
interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
}
interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements?(): Promise<void>;
  unwatchAdvertisements?(): Promise<void>;
  addEventListener(type: "advertisementreceived", listener: () => void, options?: { once?: boolean }): void;
  addEventListener(type: string, listener: (event: Event) => void): void;
}
interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  connected: boolean;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}
interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}
interface BluetoothRemoteGATTCharacteristic {
  properties: {
    notify?: boolean;
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  startNotifications(): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  writeValue(value: BufferSource): Promise<void>;
  addEventListener(type: string, listener: (event: Event) => void): void;
  value?: DataView;
}
