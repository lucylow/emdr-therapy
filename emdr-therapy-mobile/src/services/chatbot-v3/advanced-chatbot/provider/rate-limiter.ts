export class SlidingWindowRateLimiter {
  private readonly timestamps:number[]=[];
  constructor(private readonly limit:number,private readonly windowMs=60_000) {if(limit<1)throw new RangeError('limit must be positive');}
  consume(now=Date.now()):{allowed:boolean;remaining:number;retryAfterMs:number} {
    while(this.timestamps.length&&now-this.timestamps[0]>=this.windowMs)this.timestamps.shift();
    if(this.timestamps.length>=this.limit)return {allowed:false,remaining:0,retryAfterMs:Math.max(0,this.windowMs-(now-this.timestamps[0]))};
    this.timestamps.push(now);return {allowed:true,remaining:this.limit-this.timestamps.length,retryAfterMs:0};
  }
  reset():void{this.timestamps.length=0;}
  get size():number{return this.timestamps.length;}
}
export class PerConversationLimiter {
  private readonly limiters=new Map<string,SlidingWindowRateLimiter>();
  constructor(private readonly limit:number,private readonly windowMs=60_000,private readonly maxConversations=1000){}
  consume(id:string,now=Date.now()):ReturnType<SlidingWindowRateLimiter['consume']>{
    let limiter=this.limiters.get(id);
    if(!limiter){if(this.limiters.size>=this.maxConversations)this.limiters.delete(this.limiters.keys().next().value as string);limiter=new SlidingWindowRateLimiter(this.limit,this.windowMs);this.limiters.set(id,limiter);}
    return limiter.consume(now);
  }
  clear(id:string):void{this.limiters.delete(id);}
  clearAll():void{this.limiters.clear();}
}
