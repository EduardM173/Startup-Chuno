import {PaymentDesk} from './PaymentDesk';
import {Operations} from '../../components/Operations';
export function Pagos(props:Omit<Parameters<typeof Operations>[0],'payment'>){return props.admin?<Operations {...props} payment/>:<PaymentDesk {...props}/>}
