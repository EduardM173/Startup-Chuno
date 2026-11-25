import {Operations} from '../../components/Operations';
import {TransferDesk} from './TransferDesk';
export function Transferencias(props:Omit<Parameters<typeof Operations>[0],'payment'>){return props.admin?<Operations {...props} payment={false}/>:<TransferDesk {...props}/>}
