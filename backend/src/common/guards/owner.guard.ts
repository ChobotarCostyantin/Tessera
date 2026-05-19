import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['x-owner-token'];

        if (!token) {
            throw new BadRequestException('x-owner-token header required');
        }

        request.ownerToken = token;
        return true;
    }
}