import {Operations} from '../../components/Operations';
export function Transferencias(props:Omit<Parameters<typeof Operations>[0],'payment'>){return <Operations {...props} payment={false}/>}
