import { Controller, Get } from '@nestjs/common';
import { CitiesService } from './cities.service';

// Public: city names are reference data, not sensitive.
// Required unauthenticated during new-user registration flow.
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  findActive() {
    return this.citiesService.findActive();
  }
}
