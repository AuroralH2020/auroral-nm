
export const obj = {
    cleaner: function(o:any) {
        Object.keys(o).forEach(key => {
            if (o[key] === undefined) {
                delete o[key]
            }
        })
        return  o
    }
}
