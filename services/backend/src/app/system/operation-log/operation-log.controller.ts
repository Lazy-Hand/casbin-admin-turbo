import { Controller, Get, Query, Param, UseGuards, ParseIntPipe } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { OperationLogService } from "./operation-log.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { QueryLoginLogDto, QueryOperationLogDto } from "./dto/operation-log.dto"
import { ApiSuccessResponse, ApiPaginatedResponse } from "@/common/decorators"
import { OperationLogEntity } from "./entities/operation-log.entity"
import { Can } from "@/app/library/casl"
import { createPaginationResponse } from "@/common/dto/pagination.dto"

@ApiTags("操作日志管理")
@Controller("operation-logs")
@ApiBearerAuth("JWT-auth")
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Get("page")
  @ApiOperation({ summary: "分页查询操作日志" })
  @ApiPaginatedResponse(OperationLogEntity, {
    description: "成功返回操作日志列表",
  })
  @Can("read", "OperationLog")
  async findPage(@Query() query: QueryOperationLogDto) {
    const { list, total, pageNo, pageSize } = await this.operationLogService.findPage(query)
    return createPaginationResponse(list, total, pageNo, pageSize)
  }

  @Get(":id")
  @ApiOperation({ summary: "查询操作日志详情" })
  @ApiSuccessResponse(OperationLogEntity, {
    description: "成功返回日志详情",
  })
  @Can("read", "OperationLog")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.operationLogService.findOne(id)
  }
}

@ApiTags("登录日志管理")
@Controller("login-logs")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class LoginLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Get("page")
  @ApiOperation({ summary: "分页查询登录日志" })
  @ApiPaginatedResponse(Object, {
    description: "成功返回登录日志列表",
  })
  @Can("read", "LoginLog")
  async findPage(@Query() query: QueryLoginLogDto) {
    const { list, total, pageNo, pageSize } = await this.operationLogService.findLoginLogPage(query)
    return createPaginationResponse(list, total, pageNo, pageSize)
  }
}
