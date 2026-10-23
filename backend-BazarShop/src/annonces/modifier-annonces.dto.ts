import { CreerAnnonceDto } from "./creer-annonces.dto.js";
import {PartialType} from "@nestjs/mapped-types"
export class ModifierAnnonceDto extends PartialType(
    CreerAnnonceDto
){}