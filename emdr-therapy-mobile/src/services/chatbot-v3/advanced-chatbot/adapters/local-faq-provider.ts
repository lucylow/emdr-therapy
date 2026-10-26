import type { ChatModelProvider, ModelRequest, ModelResult } from '../types.ts';
import { retrieveKnowledge } from '../knowledge/retrieval.ts';
/** Local provider adapter for smoke tests; it is not a machine-learning model. */
export class LocalFaqProvider implements ChatModelProvider {
 async generate(request:ModelRequest,_signal?:AbortSignal):Promise<ModelResult> {
  const result=retrieveKnowledge(request.user,{locale:request.locale,minScore:0.15,margin:0.01,reviewedOnly:true});
  return {text:result.accepted&&result.hits[0]?result.hits[0].article.body:'I do not have a reviewed local answer for that question.',provider:'local-faq-fixture'};
 }
}
