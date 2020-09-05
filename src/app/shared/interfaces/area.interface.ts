import { Models } from '../enums/major-models.enum';

export interface Area {
  aid: string;
  model: Models;
  color: string;
  name: string;
}

export const areasList: {
  Tec20: {[aid: string]: Area},
  Tec21: {[aid: string]: Area},
} = {
  Tec20: {
    'ADI': {aid: 'ADI', model: Models.Tec20, color: '#159EDA', name: 'Arquitectura y Diseño'},
    'BIO': {aid: 'BIO', model: Models.Tec20, color: '#77A34C', name: 'Bioingeniería y Procesos Químicos'},
    'CIS': {aid: 'CIS', model: Models.Tec20, color: '#C12833', name: 'Ciencias Sociales y Gobierno'},
    'COM': {aid: 'COM', model: Models.Tec20, color: '#70338A', name: 'Comunicación y Producción Digital'},
    'ING': {aid: 'ING', model: Models.Tec20, color: '#237CC1', name: 'Ingeniería'},
    'NEG': {aid: 'NEG', model: Models.Tec20, color: '#EA6E33', name: 'Negocios'},
    'SLD': {aid: 'SLD', model: Models.Tec20, color: '#00877B', name: 'Salud'},
    'TIE': {aid: 'TIE', model: Models.Tec20, color: '#024C7A', name: 'Tecnologías de Información y Electrónica'},
  },
  Tec21: {
    'AMC': {aid: 'AMC', model: Models.Tec21, color: '#069E45', name: 'Ambiente Construido'},
    'CIS': {aid: 'CIS', model: Models.Tec21, color: '#C1181B', name: 'Ciencias Sociales'},
    'ESC': {aid: 'ESC', model: Models.Tec21, color: '#71338A', name: 'Estudios Creativos'},
    'IBQ': {aid: 'IBQ', model: Models.Tec21, color: '#237BBF', name: 'Ing > Bioingeniería y Procesos Químicos'},
    'ICI': {aid: 'ICI', model: Models.Tec21, color: '#237BBF', name: 'Ing > Ciencias Aplicadas'},
    'ICT': {aid: 'ICT', model: Models.Tec21, color: '#237BBF', name: 'Ing > Computación y Tecnologías de Información'},
    'IIT': {aid: 'IIT', model: Models.Tec21, color: '#237BBF', name: 'Ing > Innovación y Transformación'},
    'NEG': {aid: 'NEG', model: Models.Tec21, color: '#003DA6', name: 'Negocios'},
    'SLD': {aid: 'SLD', model: Models.Tec21, color: '#69C0B2', name: 'Salud'},
    'REG': {aid: 'REG', model: Models.Tec21, color: '#ff6a20', name: 'Asociaciones Regionales'},
    'CAP': {aid: 'CAP', model: Models.Tec21, color: '#ff2e2a', name: 'Capítulos Estudiantiles'},
    //'SOC': {aid: 'SOC', model: Models.Tec21, color: '#4c2795', name: 'Sociedades de Alumnos'},
  },
}
