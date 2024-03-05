import { beforeAll, describe, expect, it } from 'vitest'

import { PlumberScript } from '../PlumberScript'
import { beforeEach } from 'node:test'

const plumber = new PlumberScript()

describe('Class', () => {
    beforeAll(() => {
        plumber.evaluate(`
            class Person {
                init(first, last) {
                    this.first = first;
                    this.last = last;
                }

                fullName() {
                    return this.first + " " + this.last;
                }

                setFirst(first) {
                    this.first = first;
                }

                setLast(last) {
                    this.last = last;
                }
            }
        `)

        plumber.evaluate(`
            class Employee extends Person {
                init(first, last, age) {
                    super.init(first, last);
                    this.age = age;
                }

                isRetirementAge() {
                    return this.age >= 65;
                }
            }
        `)
    })
    it('allows for methods in the base class to work correctly', () => {
        let fullName = plumber.evaluate(`
            let p = Person("John","Doe");
            p.fullName()
        `)
        expect(fullName).toEqual('John Doe')

        fullName = plumber.evaluate(`p.setFirst("Jane"); p.fullName()`)
        expect(fullName).toEqual('Jane Doe')

        fullName = plumber.evaluate(`p.first = "John"; p.fullName()`)
        expect(fullName).toEqual('John Doe')
  })

    it('allows for methods in the superclass to work correctly', () => {
        plumber.evaluate(`
            let e = Employee("Chu Kang","Phua",65);
        `)

        let fullName = plumber.evaluate(`e.fullName()`) // test superclass method
        expect(fullName).toEqual('Chu Kang Phua')
        
        let isRetirementAge = plumber.evaluate(`e.isRetirementAge()`)
        expect(isRetirementAge).toEqual(true)
    })
})
