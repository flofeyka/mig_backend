import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';
import { CreateFlowDto } from './create-flow.dto';

export class UpdateFlowDto extends PartialType(CreateFlowDto) {}
