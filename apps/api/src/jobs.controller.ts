import { Controller, Post, Body, Get } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly queue: QueueService) {}

  @Post('test')
  async enqueueTest(@Body() body: any) {
    const payload = body?.data ?? { message: 'hello' };
    const job = await this.queue.enqueueTest(payload);
    return { id: job.id, name: job.name, data: job.data };
  }

  @Get('test')
  async enqueueTestGet() {
    const job = await this.queue.enqueueTest({ message: 'from-get' });
    return { id: job.id, name: job.name, data: job.data };
  }
}
