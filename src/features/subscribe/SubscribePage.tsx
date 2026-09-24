import { useParams } from 'react-router';
import { SubscribeView } from './SubscribeView';
import { useSubscribeFlow } from './useSubscribeFlow';

export default function SubscribePage() {
  const { code = '' } = useParams();
  const flow = useSubscribeFlow(code);

  return (
    <SubscribeView
      state={flow.state}
      notice={flow.notice}
      onSubscribe={flow.subscribe}
      onUnsubscribe={flow.unsubscribe}
    />
  );
}
