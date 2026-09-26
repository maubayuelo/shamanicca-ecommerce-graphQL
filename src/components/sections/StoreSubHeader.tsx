import React from 'react';
import ProductSortDropdown from '../molecules/ProductSortDropdown';
import { useBodyClass } from '../../utils/dom';

type Props = {
  categoryTitle: string;
  subCategoryTitle?: string;
  onFilterClick?: () => void;
  onSortClick?: () => void;
};

export default function StoreSubHeader({ categoryTitle, subCategoryTitle }: Props) {
  useBodyClass('no-scroll', false);

  return (
    <header className="main pb-lg-responsive flex flex-col pt-legacy-15 sm:pt-7.5">
      <div className="flex flex-col justify-center items-center text-center">
        <h1 className="type-3xl type-bold m-0">{categoryTitle}</h1>
        {subCategoryTitle && (
          <p className="m-0">{subCategoryTitle}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-legacy-15 sm:pt-0">
        {/* Filter button hidden temporarily */}
        <div className="store-subheader__right" style={{ marginLeft: 'auto' }}>
          <ProductSortDropdown className="store-subheader__sort" />
        </div>
      </div>

      {/* ProductFilterPanel hidden temporarily */}
    </header>
  );
}
