export function getSessionId(userA:string, userB:string){
    return [userA,userB].sort().join("_")
}