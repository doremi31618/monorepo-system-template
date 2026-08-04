

export enum JobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export interface Job {
    id?: string;
    name: string;
    status?: JobStatus;
    runAt: Date;
    data?: unknown;
}


/**
 * 分散式排程器的核心介面 (Hexagonal Port)。
 * 負責解耦「排程邏輯」與「執行邏輯」。
 */
export abstract class JobSchedulerPort {
    /**
     * [Producer Role] 排程一個任務。
     * 
     * 負責將任務寫入資料庫 (或 Queue)。
     * - 不會立即執行。
     * - 多個實例同時呼叫時，應確保 Idempotency (冪等性)，避免重複寫入。
     * 
     * @param name - 任務名稱 (Key)，對應 registerHandler 的名稱。
     * @param data - 任務參數 (Payload)。
     * @param runAt - 預計執行時間。
     */
    abstract schedule(name: string, data: any, runAt: Date): Promise<void>;

    /**
     * [Consumer Role] 註冊任務處理器。
     * 
     * 告訴 Worker：「當你搶到名字叫 name 的任務時，請執行這個 callback function」。
     * - 這會在 Service 啟動時 (OnModuleInit) 被呼叫。
     * - 實際執行是由 Worker Loop 在背景觸發。
     * 
     * @param name - 任務名稱 (Key)。
     * @param handler - 處理任務的 Async Function。
     */
    abstract registerHandler(name: string, handler: (job: Job) => Promise<void>): void;
}