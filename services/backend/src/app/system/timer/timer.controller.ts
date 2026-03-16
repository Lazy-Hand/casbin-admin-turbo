import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { TimerService } from "./timer.service"
import { CreateTimerDto, UpdateTimerDto } from "./dto/timer.dto"
import { ApiSuccessResponse, ApiPaginatedResponse } from "@/common/decorators"
import { TimerEntity } from "./entities/timer.entity"
import { Can } from "@/app/library/casl"
import { PaginationDto, createPaginationResponse } from "@/common/dto/pagination.dto"

@ApiTags("定时任务管理")
@Controller("timers")
@ApiBearerAuth("JWT-auth")
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Get("page")
  @Can("read", "Timer")
  @ApiOperation({ summary: "分页查询定时任务列表" })
  @ApiPaginatedResponse(TimerEntity, {
    description: "成功返回定时任务列表",
  })
  async findPage(@Query() paginationDto: PaginationDto) {
    const { list, total, pageNo, pageSize } = await this.timerService.findPage(paginationDto)
    return createPaginationResponse(list, total, pageNo, pageSize)
  }

  @Get()
  @Can("read", "Timer")
  @ApiOperation({ summary: "获取所有定时任务（不分页）" })
  @ApiSuccessResponse(TimerEntity, {
    description: "成功返回所有定时任务",
    isArray: true,
  })
  async findAll() {
    return this.timerService.findAll()
  }

  @Get(":id")
  @Can("read", "Timer")
  @ApiOperation({ summary: "获取单个定时任务详情" })
  @ApiSuccessResponse(TimerEntity, {
    description: "成功返回定时任务详情",
  })
  async findOne(@Param("id") id: string) {
    return this.timerService.findOne(+id)
  }

  @Get(":id/logs")
  @Can("read", "Timer")
  @ApiOperation({ summary: "获取定时任务执行日志" })
  async getExecutionLogs(@Param("id") id: string, @Query("limit") limit?: string) {
    return this.timerService.getExecutionLogs(+id, limit ? parseInt(limit, 10) : 50)
  }

  @Post()
  @Can("create", "Timer")
  @ApiOperation({ summary: "创建定时任务" })
  @ApiSuccessResponse(TimerEntity, {
    description: "成功创建定时任务",
  })
  async create(@Body() createTimerDto: CreateTimerDto) {
    return this.timerService.create(createTimerDto)
  }

  @Patch(":id")
  @Can("update", "Timer")
  @ApiOperation({ summary: "更新定时任务" })
  @ApiSuccessResponse(TimerEntity, {
    description: "成功更新定时任务",
  })
  async update(@Param("id") id: string, @Body() updateTimerDto: UpdateTimerDto) {
    return this.timerService.update(+id, updateTimerDto)
  }

  @Delete(":id")
  @Can("delete", "Timer")
  @ApiOperation({ summary: "删除定时任务" })
  @ApiSuccessResponse(TimerEntity, {
    description: "成功删除定时任务",
  })
  async remove(@Param("id") id: string) {
    return this.timerService.remove(+id)
  }

  @Post(":id/run")
  @Can("run", "Timer")
  @ApiOperation({ summary: "手动执行定时任务" })
  async run(@Param("id") id: string) {
    return this.timerService.run(+id)
  }
}
