
import { and, eq } from "drizzle-orm";
import { BaseRepository } from '@platform/nest-infra-database';
import { type Job, type JobStatus as JobStatusType,  JobStatus } from "./scheduling.port.js";
import { jobs } from "./scheduling.schema.js";
export class SchedulingRepository extends BaseRepository {
    createJob(job: Job) {
        return this.db.insert(jobs).values(job);
    }
    updateJobStatus(name: string, runAt: Date, status: JobStatusType) {
        return this.db.update(jobs).set({ status })
            .where(
                and(
                    eq(jobs.name, name),
                    eq(jobs.runAt, runAt)
                )
            );
    }
    deleteJob(name: string, runAt: Date) {
        return this.db.delete(jobs)
            .where(
                and(
                    eq(jobs.name, name),
                    eq(jobs.runAt, runAt)
                )
            );
    }
    getJob(name: string, runAt: Date) {
        return this.db.select().from(jobs)
            .where(
                and(
                    eq(jobs.name, name),
                    eq(jobs.runAt, runAt)
                )
            );
    }
    getPendingJobs(){
        return this.db.select().from(jobs).where(eq(jobs.status,'pending'));
    }
    lockNextJob(jobId: string, workerId: string){
        return this.db.update(jobs)
            .set({
                status: JobStatus.PROCESSING,
                lockedAt: new Date(),
                lockedByWorkerId: workerId
            })
            .where(
                and(
                    eq(jobs.id, jobId),
                    and(
                        eq(jobs.status, JobStatus.PENDING),
                        eq(jobs.lockedByWorkerId, null)
                    )
                )
            ).returning({
                id: jobs.id,
                name: jobs.name,
                runAt: jobs.runAt,
                status: jobs.status,
                lockedAt: jobs.lockedAt,
                lockedByWorkerId: jobs.lockedByWorkerId,
            });
    }
    getJobs() {
        return this.db.select().from(jobs);
    }
}
