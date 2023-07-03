/// <reference path="drag-drop.ts"/>

namespace App {
  // PROJECT TYPE
  enum ProjectStatus {
    Active,
    Finished
  }

  class Project {
    constructor(
      public id: string,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus
    ) {

    }
  }

  // PROJECT STATE MANAGMENT
  type Listener<T> = (items: T[]) => void

  class State<T> {
    protected listeners: Listener<T>[] = []

    addListener(listenerFn: Listener<T>) {
      this.listeners.push(listenerFn)
    }
  }

  class ProjectState extends State<Project> {
    private projects: Project[] = []
    private static instance: ProjectState

    private constructor() {
      super()
    }

    static getInstance() {
      if (!this.instance) {
        this.instance = new ProjectState()
      }

      return this.instance
    }

    addProject(title: string, desc: string, numOfPeople: number) {
      const newProject = new Project(
        Math.floor(Math.random() * 100000000).toString(),
        title,
        desc,
        numOfPeople,
        ProjectStatus.Active
      )

      this.projects.push(newProject)
      this.updateListeners()
    }

    moveProject(id: string, newStatus: ProjectStatus) {
      const project = this.projects.find(prj => prj.id === id)

      if (project && project.status !== newStatus) {
        project.status = newStatus
        this.updateListeners()
      }
    }

    private updateListeners() {
      for (const listenerFn of this.listeners) {
        listenerFn(this.projects.slice())
      }
    }
  }

  const projectState = ProjectState.getInstance()

  // Validate
  interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  }

  function validate(validateInput: Validatable) {
    let isValid = true
    const len = validateInput.value.toString().trim().length

    if (validateInput.required) {
      isValid = isValid && len !== 0
    }

    if (validateInput.minLength != null && typeof validateInput.value === "string") {
      isValid = isValid && len >= validateInput.minLength
    }

    if (validateInput.maxLength != null && typeof validateInput.value === "string") {
      isValid = isValid && len <= validateInput.maxLength
    }

    if (validateInput.min != null && typeof validateInput.value === "number") {
      isValid = isValid && validateInput.value >= validateInput.min
    }

    if (validateInput.max != null && typeof validateInput.value === "number") {
      isValid = isValid && validateInput.value <= validateInput.max
    }

    return isValid
  }

  // Autobind
  function autobind(
    _: any,
    _2: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      get() {
        const bound = originalMethod.bind(this)
        return bound
      }
    }

    return adjDescriptor
  }

  // COMPONENT BASE CLASS
  abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement
    hostElement: T
    element: U

    constructor(
      templateId: string,
      hostElementId: string,
      instertAtStart: boolean,
      newElementId?: string
    ) {
      this.templateElement = document.getElementById(templateId) as HTMLTemplateElement
      this.hostElement = document.getElementById(hostElementId) as T

      const importedNode = document.importNode(
        this.templateElement.content,
        true
      )
      this.element = importedNode.firstElementChild as U
      if (newElementId) this.element.id = newElementId

      this.attach(instertAtStart)
    }

    private attach(insert: boolean) {
      this.hostElement.insertAdjacentElement(insert ? "afterbegin" : "beforeend", this.element)
    }

    abstract configure(): void
    abstract renderContent(): void
  }

  // ProjectItem Class
  class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
    private project: Project

    get people() {
      let count = this.project.people
      return `${count + (count > 1 ? " people" : " person")} assigned`
    }

    constructor(hostId: string, project: Project) {
      super("single-project", hostId, false, project.id)
      this.project = project

      this.configure()
      this.renderContent()
    }

    @autobind
    dragStartHandler(event: DragEvent): void {
      event.dataTransfer!.setData("text/plain", this.project.id)
      event.dataTransfer!.effectAllowed = "move"
    }

    dragEndHandler(_: DragEvent): void {
      console.log("DragEnd")
    }

    configure(): void {
      this.element.addEventListener("dragstart", this.dragStartHandler)
      this.element.addEventListener("dragend", this.dragEndHandler)
    }

    renderContent(): void {
      this.element.querySelector("h2")!.textContent = this.project.title
      this.element.querySelector("h3")!.textContent = this.people
      this.element.querySelector("p")!.textContent = this.project.description
    }
  }

  // ProjectList Class
  class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[]

    constructor(private type: "active" | "finished") {
      super("project-list", "app", false, `${type}-projects`)
      this.assignedProjects = []

      this.configure()
      this.renderContent()
    }

    @autobind
    dragOverHandler(event: DragEvent): void {
      if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
        event.preventDefault()
        const listEl = this.element.querySelector("ul")!
        listEl.classList.add("droppable")
      }

    }


    @autobind
    dropHandler(event: DragEvent): void {
      const prjId = event.dataTransfer!.getData("text/plain")
      projectState.moveProject(
        prjId,
        this.type === "active"
          ? ProjectStatus.Active
          : ProjectStatus.Finished
      )
    }

    @autobind
    dragLeaveHandler(_: DragEvent): void {
      const listEl = this.element.querySelector("ul")!
      listEl.classList.remove("droppable")
    }

    configure(): void {
      console.log(this.element)
      this.element.addEventListener("dragover", this.dragOverHandler)
      this.element.addEventListener("dragleave", this.dragLeaveHandler)
      this.element.addEventListener("drop", this.dropHandler)

      projectState.addListener((projects: Project[]) => {
        const relevantProjects = projects.filter(prj => (this.type === "active"
          ? prj.status === ProjectStatus.Active
          : prj.status === ProjectStatus.Finished
        ))
        this.assignedProjects = relevantProjects
        this.renderProjects()
      })
    }

    renderContent() {
      const listId = `${this.type}-projects-list`
      this.element.querySelector("ul")!.id = listId
      this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS"
    }

    private renderProjects() {
      const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement

      listEl.innerHTML = ''
      for (const prjItem of this.assignedProjects) {
        new ProjectItem(
          this.element.querySelector("ul")!.id,
          prjItem
        )
      }
    }

  }

  // Main Class
  class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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

  new ProjectInput()
  new ProjectList("active")
  new ProjectList("finished")
}