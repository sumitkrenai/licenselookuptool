import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseHelper } from '../models/DatabaseHelper';
import { LookupTaxonomy } from '../models/LookupTaxonomy';
import { LookupTaxonomyService } from '../services/lookup-taxonomy.service';
import { DataService } from '../services/data.service';
import { ConfigRequest } from '../models/ConfigRequest';
import { LicenseLookupConfigRequest } from '../models/LicenseLookupConfigRequest';
import { Constant } from '../models/Constant';
import { FormStructure } from '../models/formStructure';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LookupConfiguration } from '../models/LookupConfiguration';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SubAttributeMap } from '../models/SubAttributeMap';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {

  configSearch = new Subject<string>();
  configSearchByLink = new Subject<string>();
  search: string = '';
  searchLink: string = '';
  constructor(
    private _router: Router,
    private sanitizer: DomSanitizer,
    private lookupTaxonomyService: LookupTaxonomyService,
    private dataService: DataService) {
    this.versionList = [{ id: 'V2', itemName: 'Credily V2' }, { id: 'V3', itemName: 'Credily V3' }];

    this.configSearch.pipe(
      debounceTime(600))
      .subscribe(value => {
        this.configDatabaseHelper.currentPage = 1;
        this.configDatabaseHelper.search = this.search;
        this.configDatabaseHelper.searchBy = 'licenseLookupName';
        this.getConfiguration();
      });

    this.configSearchByLink.pipe(
      debounceTime(600))
      .subscribe(value => {
        this.configDatabaseHelper.currentPage = 1;
        this.configDatabaseHelper.search = this.searchLink;
        this.configDatabaseHelper.searchBy = 'licenseLookupLink';
        this.getConfiguration();
      });
  }

  readonly Constant = Constant;
  userName: string = 'Logged In';
  databaseHelper: DatabaseHelper = new DatabaseHelper();
  lookupTaxonomyList: LookupTaxonomy[] = new Array();
  totalLookupTaxonomy: number = 0;
  loadingLookupTaxonomy: boolean = false;
  selectedTaxonomyIds: any[] = new Array();
  lookupName: string = '';
  lookupLink: string = '';
  selectedStateName: string = '';
  credilyVersion: string = '';
  crawlerType: string = this.Constant.CRAWLER_TYPE_LICENSE_LOOKUP;
  @ViewChild('lookupModalButton') lookupModalButton !: ElementRef;
  @ViewChild('mapLookupTaxonomyForm') mapLookupTaxonomyForm: any;


  dropdownSettingsTaxonomyLink !: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean; searchPlaceholderText: string; };
  selectedTaxonomyLink: any[] = new Array();
  taxonomyLinkList: any[] = new Array();

  dropdownSettingsVersion !: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean };
  selectedVersion: any[] = new Array();
  selectedVersions: any[] = new Array();
  versionList: any[] = new Array();

  addStepToggle: boolean = false;

  dropdownSettingsAttachmentType !: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean };
  selectedAttType: any[] = new Array();
  attTypeList: any[] = new Array();

  dropdownSettingsAttachmentSubType !: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean };
  selectedAttSubType: any[] = new Array();
  attSubTypeList: any[] = new Array();

  ngOnInit(): void {

    this.dropdownSettingsAttribute = {
      singleSelection: true,
      text: 'Select Attribute',
      enableSearchFilter: true,
      autoPosition: false
    }
    this.dropdownSettingsEvent = {
      singleSelection: true,
      text: 'Select Event',
      enableSearchFilter: true,
      autoPosition: false
    }
    this.dropdownSettingsClass = {
      singleSelection: true,
      text: 'Select Class',
      enableSearchFilter: true,
      autoPosition: false
    }
    this.dropdownSettingsColumn = {
      singleSelection: true,
      text: 'Select Column',
      enableSearchFilter: false,
      autoPosition: false,
      noDataLabel: 'Select Class Name First'
    }
    this.dropdownSettingsVersion = {
      singleSelection: true,
      text: 'Select Version',
      enableSearchFilter: false,
      autoPosition: false
    }
    this.dropdownSettingsTaxonomyLink = {
      singleSelection: true,
      text: 'Select Link',
      enableSearchFilter: true,
      autoPosition: false,
      searchPlaceholderText: 'Search By Name'
    }
    this.dropdownSettingsLookupNames = {
      singleSelection: false,
      badgeShowLimit: 1,
      text: 'Linked boards name',
      autoPosition: false,
      enableSearchFilter: false,
      classes: "activeSelectBox",
      enableCheckAll: true
    }

    this.dropdownSettingsAttachmentType = {
      singleSelection: true,
      text: 'Select Attachment Type',
      enableSearchFilter: true,
      autoPosition: false
    }

    this.dropdownSettingsAttachmentSubType = {
      singleSelection: true,
      text: 'Select Attachment Sub Type',
      enableSearchFilter: true,
      autoPosition: false
    }

    // this.getConfiguration();
  }

  drop(event: CdkDragDrop<any[]>) {
    debugger
    moveItemInArray(this.configurationStepList, event.previousIndex, event.currentIndex);
  }

  removeStep(i: any) {
    this.configurationStepList.splice(i, 1);
  }

  logOut() {
    localStorage.clear();
    this._router.navigate(['/auth/login']);
  }

  loadingConfiguration: boolean = false;
  configList: LookupConfiguration[] = new Array();
  totalConfiguration: number = 0;
  configDatabaseHelper: DatabaseHelper = new DatabaseHelper();
  getConfiguration() {
    debugger
    this.loadingConfiguration = true;
    this.lookupTaxonomyService.getConfiguration(this.configDatabaseHelper, this.startDate, this.endDate, this.credilyVersion, '', this.crawlerType).subscribe(response => {
      if (response.status && response.object != null) {
        this.configList = response.object;
        this.totalConfiguration = response.totalItems;
      }
      this.loadingConfiguration = false;
    }, error => {
      this.loadingConfiguration = false;
      this.dataService.showToast(error.error);
    })
  }

  configPageChanged(event: any) {
    if (event != this.configDatabaseHelper.currentPage) {
      this.configDatabaseHelper.currentPage = event;
      this.getConfiguration();
    }
  }

  openLookupModal() {
    this.selectedTaxonomyIds = [];
    this.lookupTaxonomyList = [];
    this.selectedTaxonomyLink = [];
    this.updateLinkToggle = false;
    this.selectedVersion = [];
    this.credilyVersion = '';
    this.databaseHelper = new DatabaseHelper();
    this.lookupLink = '';
    this.lookupName = '';
    this.selectedStateName = '';
    this.attachmentType = '';
    this.attachmentSubType = '';
    this.attTypeList = [];
    this.attSubTypeList = [];
    this.selectedAttType = [];
    this.selectedAttSubType = [];
    this.configurationStepList = [];
    this.selectedLookupConfigId = 0;
    this.selectedLookupName = [];
    this.lookupModalButton.nativeElement.click();
    // this.getLookupTaxonomy();
    this.type = 'mapped';
    this.showTaxonomyListToggle = false;
    this.totalLookupTaxonomy = 0;
    this.getTaxonomyLink('');
    this.getAttachmentType();
  }

  selectTaxonomyLink(event: any) {
    debugger
    this.lookupLink = '';
    this.selectedTaxonomyIds = [];
    if (event[0] != undefined) {
      var temp: { id: any, itemName: any } = { id: event[0].id, itemName: event[0].id };
      // this.selectedTaxonomyLink = event;
      this.selectedTaxonomyLink = [];
      this.selectedTaxonomyLink.push(temp);
      this.lookupLink = event[0].id;
      this.getTaxonomyByLookupLink(this.lookupLink);
      this.selectedlookupName(this.lookupLink);
    } else {
      this.getMappedTaxonomy(this.type);
    }
  }

  allLookupNamesList: any[] = new Array();
  totalLookupName: number = 0;
  selectedlookupName(lookupLink: any) {
    debugger
    this.selectedLookupNames = [];
    this.mappedLookupNames = [];
    this.lookupTaxonomyService.getLinkLookupName(lookupLink, this.crawlerType).subscribe(response => {
      if (response.dtoList != null) {
        this.allLookupNamesList = response.dtoList;
        this.allLookupNamesList.forEach(element => {
          var temp: { id: any, itemName: any } = { id: element.taxanomyId, itemName: element.lookupName };
          this.selectedLookupNames.push(temp);
          this.mappedLookupNames.push(temp);
          this.selectedLookupName.push(element.lookupName);
          // console.log(this.selectedLookupName);
        })
        this.selectedLookupNames = JSON.parse(JSON.stringify(this.selectedLookupNames));
        this.mappedLookupNames = JSON.parse(JSON.stringify(this.mappedLookupNames));
        this.totalLookupName = response.totalItems;
      }
    })
  }

  selectedLookupName: string[] = [];
  searchSelectLookupName(event: any) {
    debugger
    if (event != undefined && event.length > 0) {
      this.selectedLookupName = [];
      event.forEach((e: any) => {
        this.selectedLookupName.push(e.itemName);
      })
      this.getTaxIdsWithLookupName(this.selectedLookupName);
    } else {
      this.selectedTaxonomyIds = [];
      this.getMappedTaxonomy('mapped');
    }
  }

  getTaxIdsWithLookupName(lookupNames: any) {
    debugger
    this.loadingLookupTaxonomy = true;
    this.lookupTaxonomyService.getTaxIdsWithLookupName(lookupNames, this.lookupLink).subscribe(response => {
      this.selectedTaxonomyIds = response;
      this.getMappedTaxonomy('mapped');
    }, error => {

    })
  }

  selectVersion(event: any) {
    debugger
    this.credilyVersion = '';
    if (event[0] != undefined) {
      this.selectedVersion = event;
      this.credilyVersion = event[0].id;
    }
  }
  searchSelectVersion(event: any) {
    debugger
    this.credilyVersion = '';
    if (event[0] != undefined) {
      this.selectedVersions = event;
      this.credilyVersion = event[0].id;
    }
    this.getConfiguration();
  }

  taxanomyLinkLoading: boolean = false;
  getTaxonomyLink(search: string) {
    debugger
    if (!this.Constant.EMPTY_STRINGS.includes(this.lookupLink)) {
      this.taxanomyLinkLoading = true;
    }
    this.lookupTaxonomyService.getTaxonomyLink(search, this.crawlerType).subscribe(response => {
      if (response != null) {
        this.taxonomyLinkList = [];
        response.forEach((element: any) => {
          var temp: { id: any, itemName: any } = { id: element.link, itemName: element.name + ' - ' + element.link };
          this.taxonomyLinkList.push(temp);
        })
      }
      if (!this.Constant.EMPTY_STRINGS.includes(this.lookupLink)) {
        this.selectedTaxonomyLink = [];
        var temp: { id: any, itemName: any } = { id: this.lookupLink, itemName: this.lookupLink };
        this.selectedTaxonomyLink.push(temp);
        this.getTaxonomyByLookupLink(this.lookupLink);
        this.selectedlookupName(this.lookupLink);
      }
      this.taxanomyLinkLoading = false;
    }, error => {
      this.taxanomyLinkLoading = false;
    })
    this.taxonomyLinkList = JSON.parse(JSON.stringify(this.taxonomyLinkList));
  }

  onSearchLink(event: any) {
    debugger
    this.getTaxonomyLink(event.target.value);
  }
  getTaxonomyByLookupLink(lookupLink: string) {
    debugger
    this.selectedTaxonomyIds = [];
    this.loadingLookupTaxonomy = true;
    this.lookupTaxonomyService.getLinkTaxonomyIds(lookupLink, this.configId).subscribe(resp => {
      if (resp != null) {
        this.selectedTaxonomyIds = resp;
        if (this.selectedTaxonomyIds.length > 0) {
          this.lookupTaxonomyList.forEach(x => {
            if (this.selectedTaxonomyIds.includes(x.id)) {
              x.checked = true;
            }
          })
        }
        this.getMappedTaxonomy(this.type);
      }
      // this.loadingLookupTaxonomy = false;
    }, error => {
      // this.dataService.showToast(error.error);
      this.loadingLookupTaxonomy = false;
    })
  }

  pageChanged(event: any) {
    if (event != this.databaseHelper.currentPage) {
      this.databaseHelper.currentPage = event;
      this.getMappedTaxonomy(this.type);
    }
  }

  selectStateName() {
    this.databaseHelper.currentPage = 1;
    this.getMappedTaxonomy(this.type);
  }

  searchTaxonomy() {
    this.databaseHelper.currentPage = 1;
    this.getMappedTaxonomy(this.type);
  }


  mappedIds: number[] = new Array();
  unMappedIds: number[] = new Array();
  selectTaxonomySingle(index: number) {
    debugger

    if (this.lookupTaxonomyList[index].checked == undefined) {
      this.lookupTaxonomyList[index].checked = false;
    }

    if (this.lookupTaxonomyList[index].checked) {
      var i = this.selectedTaxonomyIds.findIndex(x => x == this.lookupTaxonomyList[index].id);
      if (i > -1) {
        this.selectedTaxonomyIds.splice(i, 1);
        this.unMappedIds.push(this.lookupTaxonomyList[index].id);
      }
    } else {
      this.selectedTaxonomyIds.push(this.lookupTaxonomyList[index].id);
      this.mappedIds.push(this.lookupTaxonomyList[index].id);
    }

    this.lookupTaxonomyList.splice(index, 1);

    this.totalLookupTaxonomy--;

  }

  @ViewChild('closeTaxomonModalButton') closeTaxomonModalButton!: ElementRef;
  @ViewChild('clickIframeButton') clickIframeButton!: ElementRef;
  setText: any;
  crawlerConfigRequest: ConfigRequest = new ConfigRequest();
  saveLookupDetailsAndToggleAddStep() {
    debugger

    this.addStepToggle = true;
    this.configurationStepList = [];
    this.closeTaxomonModalButton.nativeElement.click();
    setTimeout(() => {
      this.clickIframeButton.nativeElement.click();
    }, 500)

    this.setText = this.lookupLink.split('//')[1];

    if (this.selectedLookupConfigId > 0) {
      this.getCrawlerAttrMap(this.selectedLookupConfigId);

    }
  }

  src !: SafeResourceUrl;
  loadSite(lookupUrl: any) {
    debugger
    this.loadingIframe = true;
    this.src = this.sanitizer.bypassSecurityTrustResourceUrl('https://' + lookupUrl.target.textContent);
  }

  onLoad() {
    debugger
    this.loadingIframe = false;
  }

  closeTaxonomyModal() {
    this.databaseHelper = new DatabaseHelper();
    this.type = 'mapped';
    this.configId = 0;

    // this.selectedTaxonomyIds = [];
  }

  // ---------------------------------- add configuration section start --------------------------------

  @ViewChild('addConfigStepModalButton') addConfigStepModalButton !: ElementRef;
  @ViewChild('closeAddStepModal') closeAddStepModal !: ElementRef;
  @ViewChild('addStepForm') addStepForm: any;
  addStepFormInvalid: boolean = false;
  loadingIframe: boolean = false;
  isInvalidConfiguration: boolean = false;
  testingConfiguration: boolean = false;
  savingConfiguration: boolean = false;

  licenseLookupConfigRequest: LicenseLookupConfigRequest = new LicenseLookupConfigRequest();
  cofigStepRequest: ConfigRequest = new ConfigRequest();
  configurationStepList: ConfigRequest[] = new Array();

  dropdownSettingsAttribute!: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean };
  selectedAttribute: any[] = new Array();
  attributeList: any[] = new Array();

  dropdownSettingsEvent!: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean };
  selectedEvent: any[] = new Array();
  EventList: any[] = [{ id: 'sendKey', itemName: 'Input Value' }, { id: 'click', itemName: 'Click' }
    // , { id: 'windowClick', itemName: 'Click Window' }
  ]

  dropdownSettingsClass!: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean };
  selectedClass: any[] = new Array();
  classList: any[] = new Array();

  dropdownSettingsColumn!: { singleSelection: boolean; text: string; enableSearchFilter: boolean; autoPosition: boolean; noDataLabel: string };
  selectedColumn: any[] = new Array();
  columnList: any[] = new Array();

  dropdownSettingsLookupNames!: { singleSelection: boolean; text: string; autoPosition: boolean; enableSearchFilter: boolean; badgeShowLimit: number; classes: string; enableCheckAll: boolean; };
  selectedLookupNames: any[] = new Array();
  mappedLookupNames: any[] = new Array();

  openAddConfigModal() {
    // this.iframeUrl = this.lookupLink;
    this.attributeList = [];
    this.classList = [];
    this.columnList = [];
    this.selectedAttribute = [];
    this.selectedClass = [];
    this.selectedColumn = [];
    this.selectedEvent = [];
    this.EventList = [];
    this.customAttribute = '';
    this.customTag = '';
    this.selectedColumnNames = '';
    this.customValue = '';
    this.attTypeList = [];
    this.cofigStepRequest = new ConfigRequest();
    this.addConfigStepModalButton.nativeElement.click();
    this.getArribute();
    this.getClassName();
    this.EventList = [{ id: 'sendKey', itemName: 'Input Value' }, { id: 'click', itemName: 'Click' }, { id: 'windowClick', itemName: 'Click Window' }];
    this.dropdownSettingsEvent = {
      singleSelection: true,
      text: 'Select Event',
      enableSearchFilter: true,
      autoPosition: false
    }
  }

  getArribute() {
    // for (let i = 0; i < Array(3).length; i++) {
    //   var temp: { id: any, itemName: any} = { id: '', itemName: '' };
    //   temp.id = i+1;
    //   temp.itemName = 'Attribute ' + i;
    //   this.attributeList.push(temp);
    // }

    this.lookupTaxonomyService.getCrawlerAttribute().subscribe(response => {

      this.attributeList = response.object;

      this.attributeList = JSON.parse(JSON.stringify(this.attributeList));
    })


  }

  getClassName() {
    this.lookupTaxonomyService.getClassName().subscribe(response => {
      if (response.object != null) {
        this.classList = [];
        this.selectedClass = [];
        Object.keys(response.object).forEach((key, index) => {
          var temp: { id: any, itemName: any } = { id: key, itemName: response.object[key] };
          this.classList.push(temp);
        });
      }
    })
    this.classList = JSON.parse(JSON.stringify(this.classList));
  }


  selectCrawlerAttribute(event: any) {
    debugger
    this.cofigStepRequest.crawlerAttributeId = 0;
    if (event[0] != undefined) {
      this.selectedAttribute = event;
      this.cofigStepRequest.crawlerAttributeId = event[0].id;
      this.cofigStepRequest.crawlerAttribute = event[0].itemName;
      this.selectedEvent = [];
      if (event[0].id == 6) {
        this.EventList = [
          { id: '2', itemName: '2 Second' }, { id: '4', itemName: '4 Second' },
          { id: '6', itemName: '6 Second' }, { id: '8', itemName: '8 Second' },
          { id: '10', itemName: '10 Second' }
        ];
        this.dropdownSettingsEvent = {
          singleSelection: true,
          text: 'Select Delay',
          enableSearchFilter: true,
          autoPosition: false
        }
      } else {
        this.EventList = [{ id: 'sendKey', itemName: 'Input Value' }, { id: 'click', itemName: 'Click' }, { id: 'windowClick', itemName: 'Click Window' }];
        this.dropdownSettingsEvent = {
          singleSelection: true,
          text: 'Select Event',
          enableSearchFilter: true,
          autoPosition: false
        }
      }
    }
  }

  selectCrawlerEvent(event: any) {
    debugger
    this.cofigStepRequest.elementEvent = '';
    if (event[0] != undefined) {
      this.selectedEvent = event;
      this.cofigStepRequest.elementEvent = event[0].id;
    }
  }

  selectClassName(event: any) {
    debugger
    this.cofigStepRequest.className = '';
    this.columnList = [];
    this.subClassToggle = false;
    if (event[0] != undefined) {
      this.selectedClass = event;
      this.cofigStepRequest.className = event[0].itemName;
      if (this.cofigStepRequest.className.toLowerCase() != 'static') {
        this.getPrimaryColumn(this.cofigStepRequest.className);
        this.appUpdateSubStructureModalButton.nativeElement.click();
      }

    } else {
      this.columnList = [];
      this.selectedColumn = [];
    }
  }

  customTag: string = '';
  customAttribute: string = '';
  customValue: string = '';

  addConfigurationStep() {
    debugger
    this.selectedColumnNames = '';
    this.addStepFormInvalid = false;
    if (this.addStepForm.invalid) {
      this.addStepFormInvalid = true;
      return;
    }
    if (this.cofigStepRequest.crawlerAttributeId == 17) {
      this.cofigStepRequest.lookUpElementDesc = "//" + this.customTag + "[@" + this.customAttribute + "='" + this.customValue + "']";
      console.log(this.cofigStepRequest.lookUpElementDesc);
    }
    // console.log(this.cofigStepRequest.lookUpElementDesc);
    this.configurationStepList.push(this.cofigStepRequest);
    this.closeAddStepModal.nativeElement.click();
    // this.attributeList = [];
    // this.classList = [];
    // this.columnList = [];
    // this.selectedAttribute = [];
    // this.selectedClass = [];
    // this.selectedColumn = [];
    // this.selectedEvent = [];
    // this.EventList = [];
  }

  providerUuid: string = '';
  @ViewChild('uuidModalButton') uuidModalButton !: ElementRef;
  @ViewChild('closeUuidModal') closeUuidModal !: ElementRef;
  @ViewChild('closeSaveUuidModal') closeSaveUuidModal !: ElementRef;



  openUuidModal() {
    this.uuidModalButton.nativeElement.click();
  }

  testConfiguration() {
    debugger

    // this.closeUuidModal.nativeElement.click();
    this.licenseLookupConfigRequest.type = this.crawlerType;
    this.licenseLookupConfigRequest.version = this.credilyVersion;
    this.licenseLookupConfigRequest.licenseLookUpName = this.lookupName;
    this.licenseLookupConfigRequest.licenseLookUpLink = this.lookupLink;
    this.licenseLookupConfigRequest.attachmentType = this.attachmentType;
    this.licenseLookupConfigRequest.attachmentSubType = this.attachmentSubType;
    this.licenseLookupConfigRequest.lookupConfigId = this.selectedLookupConfigId;
    this.licenseLookupConfigRequest.taxonomyIdList = this.selectedTaxonomyIds;
    this.licenseLookupConfigRequest.userAccountUuid = String(localStorage.getItem(this.Constant.ACCOUNT_UUID));
    this.licenseLookupConfigRequest.configRequests = this.configurationStepList;
    this.licenseLookupConfigRequest.configRequests[this.index].subAttributeMapList = this.cofigStepRequest.subAttributeMapList;

    this.testingConfiguration = true;
    this.isInvalidConfiguration = false;
    this.lookupTaxonomyService.testConfiguration(this.licenseLookupConfigRequest, this.providerUuid).subscribe(response => {
      this.testingConfiguration = false;
      if (response.object != null) {
        window.open(response.object, "_blank");
      }
      setTimeout(() => {
        this.closeUuidModal.nativeElement.click();
        this.dataService.showToast('Valid Configuration.', 'success');
      }, 500)


    }, error => {
      this.isInvalidConfiguration = true;
      this.testingConfiguration = false;
    })
  }
  configstatus: string = '';
  saveConfiguration() {
    debugger
    this.savingConfiguration = true;
    this.licenseLookupConfigRequest.type = this.crawlerType;
    this.licenseLookupConfigRequest.lookupNames = this.selectedLookupName;
    this.licenseLookupConfigRequest.version = this.credilyVersion;
    this.licenseLookupConfigRequest.licenseLookUpName = this.lookupName;
    this.licenseLookupConfigRequest.mappedIds = this.mappedIds;
    this.licenseLookupConfigRequest.removeIds = this.unMappedIds;
    this.licenseLookupConfigRequest.attachmentType = this.attachmentType;
    this.licenseLookupConfigRequest.attactmentSource = this.attactmentSource;
    this.licenseLookupConfigRequest.attachmentSubType = this.attachmentSubType;
    this.licenseLookupConfigRequest.attachmentSubTypeDescription = this.attachmentSubTypeDescription;
    this.licenseLookupConfigRequest.licenseLookUpLink = this.lookupLink;
    this.licenseLookupConfigRequest.testingProviderUuid = this.providerUuid;
    this.licenseLookupConfigRequest.userAccountUuid = String(localStorage.getItem(this.Constant.ACCOUNT_UUID));
    this.licenseLookupConfigRequest.configRequests = this.configurationStepList;
    this.licenseLookupConfigRequest.lookupConfigId = this.selectedLookupConfigId;
    this.licenseLookupConfigRequest.configRequests[this.index].subAttributeMapList = this.cofigStepRequest.subAttributeMapList;
    if (!this.isInvalidConfiguration) {

      if (this.selectedLookupConfigId > 0) {
        this.licenseLookupConfigRequest.configStatus = this.configstatus;
        this.licenseLookupConfigRequest.lastTestedOn = this.lastTestedOn;
        this.licenseLookupConfigRequest.screenShotUrl = this.screenShotUrl;
        this.licenseLookupConfigRequest.configReportStatus = this.configReportStatus;
        this.lookupTaxonomyService.updateConfiguration(this.licenseLookupConfigRequest).subscribe(response => {
          this.savingConfiguration = false;
          this.dataService.showToast('Configuration Saved Successfully.');
          this.addStepToggle = false;
          this.selectedLookupConfigId = 0;
          setTimeout(() => {
            this.closeSaveUuidModal.nativeElement.click();
          }, 500)
          this.getConfiguration();
        }, error => {
          this.savingConfiguration = false;
          this.dataService.showToast(error.error);
        })
      } else {
        this.lookupTaxonomyService.createConfiguration(this.licenseLookupConfigRequest).subscribe(response => {
          this.savingConfiguration = false;
          this.dataService.showToast('Configuration Saved Successfully.');
          this.addStepToggle = false;
          this.selectedLookupConfigId = 0;
          setTimeout(() => {
            this.closeSaveUuidModal.nativeElement.click();
          }, 500)
          this.getConfiguration();
        }, error => {
          this.savingConfiguration = false;
          this.dataService.showToast(error.error);
        })
      }
    }
  }

  //--------------------------------------- Column Name Section -----------------------------------


  @ViewChild('subStructureUpdateModalCloseButton') subStructureUpdateModalCloseButton!: ElementRef;
  @ViewChild('appUpdateSubStructureModalButton') appUpdateSubStructureModalButton!: ElementRef;

  openAddStepAndCloseColumn() {
    this.selectedColumnNames = '';
    this.subStructureUpdateModalCloseButton.nativeElement.click();
    this.addConfigStepModalButton.nativeElement.click();
    // this.openAddConfigModal();
  }

  columns: { key: '', values: { isSelected: boolean, value: string, key: string, values: { isSelected: boolean, value: string, key: string, class: string }[] }[], isSelected: boolean, type: string }[] = new Array();
  loadingColumn: boolean = false;
  getPrimaryColumn(className: string) {
    debugger
    this.columns = [];
    return new Promise((res) => {
      this.loadingColumn = true;
      this.lookupTaxonomyService.getColumnName(className).subscribe(response => {

        response.object.forEach((element: any) => {

          Object.keys(element).forEach((k: any) => {
            var obj: { key: '', values: { isSelected: boolean, value: string, key: string, values: { isSelected: boolean, value: string, key: string, class: string }[] }[], isSelected: false, type: string } = { key: '', values: [], isSelected: false, type: "string" };
            obj.key = k;
            if (element[k] instanceof Array) {
              obj.type = "array";
              element[k].forEach((element: any) => {
                var innerObj = { isSelected: false, value: element, key: '', values: [] }
                obj.values.push(innerObj);
              });

            } else {
              obj.type = element[k];
            }
            this.columns.push(obj);
          });

        });

        res(true);
        this.loadingColumn = false;
      }, error => {
        this.loadingColumn = false;
      });


    });

  }

  selectedNestedColumns: any;
  selectNestedValue(index: number, innerIndex: number, valueObj: any) {
    debugger
    this.subIndexedTab = innerIndex;
    this.selectedNestedColumns = '';
    this.selectedColumns = '';
    this.selectedNestedsubColumn = '';
    this.columns[index].values.forEach(element => {
      element.isSelected = false;
    });
    valueObj.isSelected = true;
    this.selectedNestedColumns = this.columns[index].values[innerIndex].key;
    this.indexedNestedTab = innerIndex;
    if (valueObj.type == 'object') {
      this.getPriSubNestedEntity(valueObj);
    }
  }

  indexedTab: number = -1;
  indexedNestedTab: number = -1;
  selectedColumns: any;
  flag: boolean = false;
  selectedEntity: FormStructure = new FormStructure();
  addColumnToggle: boolean = false;
  selectTab(columnObj: any, index: any) {
    debugger
    this.selectedEntity.val = "";
    this.selectedColumns = "";
    this.selectedNestedColumns = "";
    this.columns.forEach(element => {
      element.isSelected = false;
    });
    this.selectedColumns = this.columns[index].key;
    this.columns[index].isSelected = true;
    this.addColumnToggle = true;
    this.flag = false;
    this.indexedTab = index;

    if (columnObj.type.type == 'object') {
      this.getNestedPrimaryColumn(columnObj);
    }
    if (this.columns[index].values.length == 0) {
      this.flag = true;
    }
  }

  countLoader: boolean = false;
  getNestedPrimaryColumn(dataObj: any) {
    debugger
    dataObj.values = [];
    if (dataObj.type.type == 'object') {
      this.countLoader = true;
      this.lookupTaxonomyService.getColumnName(dataObj.type.class).subscribe(response => {

        response.object.forEach((element: any) => {

          Object.keys(element).forEach((k: any) => {
            var obj: { key: '', isSelected: false, type: string, class: string } = { key: '', isSelected: false, type: "string", class: '' };
            obj.key = k;
            obj.type = element[k].type;
            obj.class = element[k].class;
            dataObj.values.push(obj);
          });

        });
        this.countLoader = false;
        console.log(dataObj);
      }, (error) => {
        this.countLoader = false;

      });
    } else {
      // structureObj.secVal = dataObj.entity;
    }

  }

  getPriSubNestedEntity(dataObj: any) {
    debugger
    dataObj.values = [];
    if (dataObj.type == 'object') {
      this.countLoader = true;
      this.lookupTaxonomyService.getColumnName(dataObj.class).subscribe(response => {

        response.object.forEach((element: any) => {

          Object.keys(element).forEach((k: any) => {
            var obj: { key: '', isSelected: false, type: string } = { key: '', isSelected: false, type: "string" };
            obj.key = k;
            obj.type = element[k].type;
            dataObj.values.push(obj);
          });

        });
        this.countLoader = false;
      }, (error) => {
        this.countLoader = false;

      });
    } else {
      // structureObj.secVal = dataObj.entity;
    }

  }

  subIndexedTab: any;
  selectedNestedsubColumn: any;
  selectNestedSubValue(columnId: any, nestedColumnId: any, nestedSubColumnId: any, nestedSubValueObj: any) {
    debugger
    this.columns[columnId].values[nestedColumnId].values.forEach(element => {
      element.isSelected = false;
    });
    this.selectedColumns = '';
    this.selectedNestedColumns = '';
    this.selectedNestedsubColumn = "";
    nestedSubValueObj.isSelected = true;
    this.selectedNestedsubColumn = this.columns[columnId].values[nestedColumnId].values[nestedSubColumnId].key;
  }




  // selectedColumnNames : string[] = new Array();
  selectedColumnNames: string = '';

  addColumns() {
    debugger
    if (this.selectedColumns.length > 0) {
      this.selectedColumnNames = this.selectedColumnNames.concat(this.selectedColumns + ",");
    } else if (this.selectedNestedColumns.length > 0) {
      this.selectedColumnNames = this.selectedColumnNames.concat(this.selectedNestedColumns + ",");
    } else {
      this.selectedColumnNames = this.selectedColumnNames.concat(this.selectedNestedsubColumn + ",");
    }
  }

  addCloumnNameObj() {
    debugger

    // if (!this.Constant.EMPTY_STRINGS.includes(this.selectedNestedsubColumn)) {
    //   this.selectedEntity.val = this.selectedEntity.val + this.selectedColumns + "." + this.selectedNestedColumns + "." + this.selectedNestedsubColumn;
    // } else if (!this.Constant.EMPTY_STRINGS.includes(this.selectedNestedColumns)) {
    //   this.selectedEntity.val = this.selectedEntity.val + this.selectedColumns + "." + this.selectedNestedColumns;
    // } else {
    //   this.selectedEntity.val = this.selectedEntity.val + this.selectedColumns
    // }
    // this.cofigStepRequest.columnName = this.selectedEntity.val;
    // if(this.index > 0){

    //   this.cofigStepRequest.subAttributeMapList[this.index].columnName = this.selectedColumnNames;
    // } else {
    //   this.cofigStepRequest.columnName = this.selectedColumnNames;
    // }
    this.selectedColumnNames = this.selectedColumnNames.slice(0, -1);
    this.cofigStepRequest.columnName = this.selectedColumnNames;
    this.openAddStepAndCloseColumn();
  }



  selectedLookupConfigId: number = 0;
  lastTestedOn: any;
  screenShotUrl: any;
  configReportStatus: any;
  configId: number = 0;
  openEditModel(config: LookupConfiguration) {
    debugger
    this.configstatus = config.configStatus;
    this.lastTestedOn = config.lastTestedOn;
    this.screenShotUrl = config.url;
    this.configReportStatus = config.reportStatus;
    this.selectedLookupConfigId = config.id;
    this.lookupName = config.lookupName;
    this.lookupLink = config.lookupLink;
    this.configId = config.id;
    this.updateLinkToggle = false;
    this.showTaxonomyListToggle = false;
    this.unMappedIds = [];
    this.mappedIds = [];
    this.selectedTaxonomyLink = [];
    this.selectedVersion = [];
    this.selectedAttType = [];
    this.selectedAttSubType = [];
    if (!Constant.EMPTY_STRINGS.includes(config.attachmentType)) {
      var attType: { id: any, itemName: any } = { id: config.attachmentType, itemName: config.attachmentType };
      this.selectedAttType.push(attType);
      this.attachmentType = config.attachmentType;
    }
    if (!Constant.EMPTY_STRINGS.includes(config.attachmentSubType)) {
      var attSubType: { id: any, itemName: any } = { id: config.attachmentSubType, itemName: config.attachmentSubType };
      this.selectedAttSubType.push(attSubType);
      this.attachmentSubType = config.attachmentSubType;
    }
    if (config.version == 'V2') {
      var temp: { id: any, itemName: any } = { id: 'V2', itemName: 'Credily V2' };
      this.selectedVersion.push(temp);
      this.credilyVersion = 'V2';
    } else {
      var temp: { id: any, itemName: any } = { id: 'V3', itemName: 'Credily V3' };
      this.selectedVersion.push(temp);
      this.credilyVersion = 'V3';
    }
    this.selectedTaxonomyIds = config.taxonomyId;
    this.getAttachmentType();
    this.getTaxonomyLink('');
    this.lookupModalButton.nativeElement.click();
  }

  loadingConfgurationStep: boolean = false;
  getCrawlerAttrMap(id: any) {
    this.loadingConfgurationStep = true;
    this.lookupTaxonomyService.getCrawlerAttrMap(id).subscribe(response => {
      if (response.status && response.object != null) {
        this.configurationStepList = response.object;
      }
      this.loadingConfgurationStep = false;
    }, error => {
      this.loadingConfgurationStep = false;
    })
  }

  @ViewChild('deleteModalButton') deleteModalButton!: ElementRef;
  deletedId: number = 0;
  deletedIndex: number = 0;
  deleteConfiguration(id: number, i: any) {
    debugger
    this.deletedId = id;
    this.deletedIndex = i;
    this.deleteModalButton.nativeElement.click();
  }

  deletingConfguration: boolean = false;
  @ViewChild('deleteCloseModalButton') deleteCloseModalButton!: ElementRef;
  confirmDeleteConfiguration() {
    debugger
    // this.configList.splice(this.deletedIndex, 1);
    // this.totalConfiguration = this.totalConfiguration-1;
    this.deletingConfguration = true;
    this.lookupTaxonomyService.deleteConfiguration(this.deletedId).subscribe(response => {
      if (response.status) {
        this.dataService.showToast(response.message);
      }
      this.deleteCloseModalButton.nativeElement.click();
      this.getConfiguration();
      this.deletingConfguration = false;
    }, error => {
      this.deletingConfguration = false;
    })
  }

  @ViewChild('replicateModalButton') replicateModalButton!: ElementRef;
  @ViewChild('replicateModalCloseButton') replicateModalCloseButton!: ElementRef;
  replicateConfig(id: number) {
    this.selectedLookupConfigId = id;
    this.selectedVersion = [];
    this.credilyVersion = '';
    this.replicateModalButton.nativeElement.click();
  }

  replicatingConfig: boolean = false;
  replicateLookupConfig() {
    this.replicatingConfig = true;
    this.lookupTaxonomyService.replicateLookupConfig(String(localStorage.getItem(this.Constant.ACCOUNT_UUID)), this.selectedLookupConfigId).subscribe(response => {
      setTimeout(() => {
        this.replicateModalCloseButton.nativeElement.click();
      }, 500)
      this.replicatingConfig = false;
      this.getConfiguration();
    }, error => {
      this.replicatingConfig = false;
    })
  }

  ids: number[] = new Array;
  type: string = 'mapped';
  getMappedTaxonomy(type: string) {
    debugger
    this.type = type;
    if (type == 'mapped' && this.selectedTaxonomyIds.length == 0) {
      this.lookupTaxonomyList = [];
      this.totalLookupTaxonomy = 0;
      this.loadingLookupTaxonomy = false;
      return;
    }
      this.loadingLookupTaxonomy = true;
      this.lookupTaxonomyService.getMappedTaxonomy(this.selectedTaxonomyIds, type, this.selectedStateName, this.databaseHelper).subscribe(response => {
        if (response.status) {
          this.lookupTaxonomyList = response.object.taxonomyList;
          this.totalLookupTaxonomy = response.object.totalItems;
          if (type == 'mapped') {
            this.lookupTaxonomyList.forEach(l => {
              l.checked = true;
            })
          }
        }
        this.loadingLookupTaxonomy = false;
      }, error => {
        this.loadingLookupTaxonomy = false;
      })
   
  }

  showTaxonomyListToggle: boolean = false;
  showTaxonomyDiv() {
    this.showTaxonomyListToggle = !this.showTaxonomyListToggle;
  }

  @ViewChild('saveUuidModalButton') saveUuidModalButton!: ElementRef;
  uuidSaveModal() {
    this.saveUuidModalButton.nativeElement.click();
  }


  updateStatus(id: any) {
    this.lookupTaxonomyService.updateConfigStatus(id).subscribe(response => {
      if (response.status) {
        this.dataService.showToast("Status updated Successfully ");
      }
      this.getConfiguration();
    }, error => {

    })
  }

  updateLinkToggle: boolean = false;
  oldLink: string = '';
  newLink: string = '';
  updatingLoader: boolean = false;
  switchUpdateLinkToggle() {
    this.oldLink = this.lookupLink;
    this.newLink = '';
    this.updateLinkToggle = !this.updateLinkToggle
  }

  updateLookupLink() {
    debugger
    this.updatingLoader = true;
    this.lookupTaxonomyService.updateLookupLink(this.oldLink, this.newLink).subscribe(response => {
      this.getTaxonomyLink('');
      this.getConfiguration();
      this.updatingLoader = false;
      this.updateLinkToggle = false;
      this.lookupLink = '';
      this.selectedTaxonomyLink = [];
    }, error => {
      this.getTaxonomyLink('');
      this.updatingLoader = false;
    })
  }

  maxDate: any;
  selected !: { startDate: moment.Moment, endDate: moment.Moment };
  startDate: any = null;
  endDate: any = null;
  selectDateFilter(event: any) {
    debugger
    if (this.selected != undefined && this.selected != null && this.selected.startDate != undefined && this.selected.endDate != undefined && this.selected != null) {
      this.startDate = new Date(this.selected.startDate.toDate()).toDateString();
      this.endDate = new Date(this.selected.endDate.toDate()).toDateString();
    }
    this.getConfiguration();

  }


  getConfigurationWithType(type: string) {
    this.crawlerType = type;
    this.getConfiguration();
  }

  attachmentTypeList: any[] = new Array()
  getAttachmentType() {
    this.lookupTaxonomyService.getAttachmentType().subscribe(response => {
      response.forEach((e: any) => {
        var temp: { id: any, itemName: any } = { id: e.id, itemName: e.name };
        this.attTypeList.push(temp);
      })
      this.attTypeList = JSON.parse(JSON.stringify(this.attTypeList));
    }, error => {

    })
  }

  attachmentId: number = 0;
  attachmentType: string = '';
  selectAttType(event: any) {
    debugger
    this.attSubTypeList = [];
    this.attachmentSubType = '';
    this.attachmentType = '';
    if (event[0] != undefined && event.length > 0) {
      this.attachmentId = event[0].id;
      this.attachmentType = event[0].itemName;
      this.getAttachmentSubType();
    }
  }

  getAttachmentSubType() {
    this.lookupTaxonomyService.getAttachmentSubType(this.attachmentId).subscribe(response => {
      response.forEach((e: any) => {
        var temp: { id: any, itemName: any, description: any, source: any  } = { id: e.id, itemName: e.name, description: e.description, source: e.source};
        this.attSubTypeList.push(temp);
      })
      this.attSubTypeList = JSON.parse(JSON.stringify(this.attSubTypeList));
    }, error => {

    })
  }

  attactmentSource:string='';
  attachmentSubType: string = '';
  attachmentSubTypeDescription: string = '';
  selectAttSubType(event: any) {
    debugger
    if (event[0] != undefined && event.length > 0) {
      this.attachmentSubType = event[0].itemName;
      this.attachmentSubTypeDescription = event[0].description;
      this.attactmentSource = event[0].source;
    }
  }
  addSubStep() {
    this.cofigStepRequest.subAttributeMapList.push(new SubAttributeMap());
  }

  removeSubStep(index: number) {
    this.cofigStepRequest.subAttributeMapList.splice(index, 1);
    this.cofigStepRequest.subAttributeMapList[index].className = '';
    this.cofigStepRequest.subAttributeMapList[index].columnName = '';
  }

  index: number = 0;
  subClassToggle: boolean = false;
  selectSubClassName(event: any, index: number) {
    debugger
    this.subClassToggle = false;
    this.cofigStepRequest.subAttributeMapList[index].className = '';
    this.columnList = [];
    this.index = index;
    if (event[0] != undefined) {
      this.subClassToggle = true;
      this.cofigStepRequest.subAttributeMapList[index].selectedClass = event;
      this.cofigStepRequest.subAttributeMapList[index].className = event[0].itemName;
      if (this.cofigStepRequest.subAttributeMapList[index].className.toLowerCase() != 'static') {
        this.getPrimaryColumn(this.cofigStepRequest.subAttributeMapList[index].className);
        this.appUpdateSubStructureModalButton.nativeElement.click();
      }

    } else {
      this.columnList = [];
      this.selectedColumn = [];
    }
  }

  addSubCloumnNameObj() {
    debugger
    this.selectedColumnNames = this.selectedColumnNames.slice(0, -1);
    this.cofigStepRequest.subAttributeMapList[this.index].columnName = this.selectedColumnNames;
    this.openAddStepAndCloseColumn();
  }


  removeAllTax:boolean = false;
  removeAllTaxonomy(event: any) {
    if (event.target.checked) {
      console.log('checked');
      this.type = 'unmap';
      this.removeAllTax = true;
      this.licenseLookupConfigRequest.removeAll = 'yes';
      this.lookupTaxonomyList = [];
    }


  }

}
