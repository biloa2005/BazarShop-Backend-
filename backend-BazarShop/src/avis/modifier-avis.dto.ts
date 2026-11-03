import { CreerAvisDto } from "./creer-avis.dto.js";
import {PartialType} from "@nestjs/mapped-types"
export class ModifierAvisDto extends PartialType(CreerAvisDto){}