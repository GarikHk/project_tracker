import Component from "./base-component"
import autobind from "../decorators/autobind"
import { Validatable, validate } from "../util/validation"
import projectState from "../state/project-state"

export default class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement
  descriptionInputElement: HTMLInputElement
  peopleInputElement: HTMLInputElement

  constructor() {
    super("project-input", "app", true, "user-input")

    this.titleInputElement = this.element.querySelector("#title") as HTMLInputElement
    this.descriptionInputElement = this.element.querySelector("#description") as HTMLInputElement
    this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement

    this.configure()
  }

  configure() {
    this.element.addEventListener("submit", this.submitHandler)
  }

  renderContent(): void {

  }

  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value
    const enteredDescription = this.descriptionInputElement.value
    const enteredPeople = +this.peopleInputElement.value

    const titleValid: Validatable = {
      value: enteredPeople,
      required: true,
    }

    const descValid: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    }

    const peopleValid: Validatable = {
      value: enteredPeople,
      required: true,
      min: 1,
      max: 5,
    }

    if (
      !validate(titleValid) ||
      !validate(descValid) ||
      !validate(peopleValid)
    ) {
      alert("Shit")
    } else {
      return [enteredTitle, enteredDescription, enteredPeople]
    }
  }

  private clearInput() {
    this.titleInputElement.value = ""
    this.descriptionInputElement.value = ""
    this.peopleInputElement.value = ""
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault()
    const userInput = this.gatherUserInput() //this.titleInputElement.value

    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput

      projectState.addProject(title, desc, people)
      this.clearInput()
    }
  }
}