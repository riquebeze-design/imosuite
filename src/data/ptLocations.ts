import type { District } from "@/types/realestate";

export const DISTRICTS: District[] = [
  "Lisboa",
  "Porto",
  "Setúbal",
  "Braga",
  "Aveiro",
  "Faro",
  "Coimbra",
  "Leiria",
  "Santarém",
];

export const MUNICIPALITIES_BY_DISTRICT: Record<District, string[]> = {
  Lisboa: ["Lisboa", "Sintra", "Cascais", "Oeiras", "Amadora"],
  Porto: [
    "Porto",
    "Vila Nova de Gaia",
    "Matosinhos",
    "Maia",
    "Gondomar",
  ],
  Setúbal: ["Almada", "Seixal", "Barreiro", "Setúbal", "Montijo"],
  Braga: ["Braga", "Guimarães", "Barcelos", "Vila Nova de Famalicão"],
  Aveiro: ["Aveiro", "Ílhavo", "Águeda", "Ovar"],
  Faro: ["Faro", "Loulé", "Albufeira", "Portimão", "Lagos"],
  Coimbra: ["Coimbra", "Figueira da Foz", "Cantanhede"],
  Leiria: ["Leiria", "Marinha Grande", "Caldas da Rainha"],
  Santarém: ["Santarém", "Tomar", "Abrantes"],
};

export const PARISHES_BY_MUNICIPALITY: Record<string, string[]> = {
  Lisboa: ["Arroios", "Avenidas Novas", "Estrela", "Alvalade"],
  Sintra: ["Algueirão-Mem Martins", "Rio de Mouro", "Colares"],
  Cascais: ["Cascais e Estoril", "Carcavelos e Parede"],
  Oeiras: ["Oeiras e São Julião da Barra", "Algés"],
  Amadora: ["Venteira", "Falagueira-Venda Nova"],

  Porto: ["Cedofeita", "Bonfim", "Foz do Douro"],
  "Vila Nova de Gaia": ["Santa Marinha", "Canidelo"],
  Matosinhos: ["Matosinhos e Leça da Palmeira", "São Mamede de Infesta"],
  Maia: ["Cidade da Maia", "Águas Santas"],
  Gondomar: ["Gondomar (São Cosme)", "Rio Tinto"],

  Almada: ["Costa da Caparica", "Cacilhas"],
  Seixal: ["Amora", "Corroios"],
  Barreiro: ["Alto do Seixalinho", "Santo André"],
  Setúbal: ["São Sebastião", "Sado"],
  Montijo: ["Montijo e Afonsoeiro"],

  Braga: ["São Vicente", "Nogueira"],
  Guimarães: ["Azurém", "Creixomil"],
  Barcelos: ["Arcozelo", "Vila Boa"],
  "Vila Nova de Famalicão": ["Antas", "Calendário"],

  Aveiro: ["Glória e Vera Cruz", "Esgueira"],
  "Ílhavo": ["Gafanha da Nazaré", "Ílhavo (Centro)"],
  "Águeda": ["Águeda e Borralha"],
  Ovar: ["Ovar, São João, Arada"],

  Faro: ["Sé e São Pedro", "Montenegro"],
  Loulé: ["Quarteira", "Almancil"],
  Albufeira: ["Albufeira e Olhos de Água"],
  Portimão: ["Portimão", "Alvor"],
  Lagos: ["São Gonçalo", "Luz"],

  Coimbra: ["Santo António dos Olivais", "Sé Nova"],
  "Figueira da Foz": ["Buarcos", "Tavarede"],
  Cantanhede: ["Cantanhede e Pocariça"],

  Leiria: ["Leiria, Pousos, Barreira"],
  "Marinha Grande": ["Marinha Grande", "Vieira de Leiria"],
  "Caldas da Rainha": ["Nossa Senhora do Pópulo"],

  Santarém: ["Marvila", "Salvador"],
  Tomar: ["São João Baptista", "Santa Maria"],
  Abrantes: ["São Vicente", "Alferrarede"],
};
