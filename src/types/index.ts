export interface College {
  id:string
  name:string
  location:string
  rating:number
  popularFor:string
  imgUrl:string
  details: {
    description:string
    programs:string
  }
}

