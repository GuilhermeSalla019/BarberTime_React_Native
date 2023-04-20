const moment = require('moment');

module.exports = {
    SLOT_DURATION: 30,
    isOpened: async (horarios) => {},
    //Conveter valor inteiro em centavos
    toCents: (price) => {
        return parseInt(price.toString().replace('.', '').replace(',', ''));
    },
    //Converter horas em minutos
    hourToMinutes: (hourMinute) => {
        //1:20
        const [hour, minutes] = hourMinute.split('')
        return parseInt(parseInt(hour) * 60 + parseInt(minutes));
    },
    //Cortar minutos
    sliceMinutes: (start, end, duraction) => {
        const slices = []; // [1:30, 2:00, 2:30]
        let count = 0;

        //Exemplo: 90 = 1:30 = duração do servico
        start = moment(start);
        //3:00 = 180
        end = moment(end);

        //Loop
        while(end > start){

            slices.push(start.format('HH:mm'));
            start = start.add(duraction, 'minutes');
            count++;
        }

        return slices;
    },
    //concatenar data e hora
    mergeDateTime: (date, time) => {
        const merged = `${moment(date).format('YYYY-MM-DD')}T${moment(time).format(
        'HH:mm'
        )}`;
        return merged;
    },
    //Dividir em blocos horarios
    splitByValue: (array, value) => {
        let newArray = [[]];
        array.forEach((item) => {
            if (item == value) {
                newArray[newArray.length - 1].push(item);
            } else {
                newArray.push([]);
            }
        });
        return newArray;
    }
};